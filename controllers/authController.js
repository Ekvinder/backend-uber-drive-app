const supabase = require('../config/supabase');
const multer = require('multer');
const upload = multer(); 
// Helper to upload file buffer to Supabase Storage
async function uploadDocument(userId, fileBuffer, originalName) {
  const fileExt = originalName.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from('driver-documents')
    .upload(fileName, fileBuffer, { upsert: true });
  if (error) throw error;
  // Get public URL
  const { publicURL, error: urlError } = supabase.storage
    .from('driver-documents')
    .getPublicUrl(fileName);
  if (urlError) throw urlError;
  return publicURL;
}
// Middleware to handle multipart/form-data for signup
exports.signupMiddleware = upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
]);

// Sign Up
exports.signUp = async (req, res) => {
  const { email, password,full_name,phone,role } = req.body;
  
  if (!email || !password || !full_name || !phone || !role ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      
    const { data:signUpData, error:signUpError } = await supabase.auth.signUp({
      email,
      password,      
    });

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }
   const user = signUpData.user;
    // 2. Insert profile linked to auth user id
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          full_name,
          phone,
          role,
        },
      ]);
    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }
    // 3. If driver, insert driver_details with uploaded files
      if (role === 'driver') {
      const licenseFile = req.files?.license?.[0];
      const insuranceFile = req.files?.insurance?.[0];
      if (!licenseFile || !insuranceFile) {
        return res.status(400).json({ error: 'License and insurance documents are required for drivers' });
      }
      // Upload files to Supabase Storage
      const licenseUrl = await uploadDocument(user.id, licenseFile.buffer, licenseFile.originalname);
      const insuranceUrl = await uploadDocument(user.id, insuranceFile.buffer, insuranceFile.originalname);
      // Vehicle info from body
      const { vehicle_make, vehicle_model, vehicle_year, license_number } = req.body;

      if (!vehicle_make || !vehicle_model || !vehicle_year || !license_number) {
        return res.status(400).json({ error: 'Vehicle information is required for drivers' });
      }
      const { error: driverError } = await supabase
        .from('driver_details')
        .insert([
          {
            id: user.id,
            vehicle_make,
            vehicle_model,
            vehicle_year: parseInt(vehicle_year, 10),
            license_number,
            license_url: licenseUrl,
            insurance_url: insuranceUrl,
            verified: false,
          },
        ]);
      if (driverError) {
        return res.status(400).json({ error: driverError.message });
      }
    }

   console.log('Signup request body:', req.body);
    console.log('Signup request files:', req.files);
    res.status(201).json({ message: 'User  signed up successfully', user });
  } catch (err) {
    console.error('Signup error:', err.stack || err);
    res.status(500).json({ error: 'internal Server error' });
  }
};
// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data:signInData, error:signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError ) {
      return res.status(400).json({ error: signInError .message });
    }

    const session = signInData.session;
    const user = signInData.user;
    // 2. Fetch profile by user id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }
      let driverDetails = null;
    if (profile.role === 'driver') {
      const { data, error } = await supabase
        .from('driver_details')
        .select('verified')
        .eq('id', user.id)
        .single();
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      driverDetails = data;
    }

    res.status(200).json({ message: 'User  logged in successfully', session , profile});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Social Auth URL (frontend will redirect user here)
exports.getOAuthUrl = async (req, res) => {
  const { provider } = req.params;
  const redirectTo = process.env.FRONTEND_REDIRECT_URL; // Your frontend callback URL
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // data.url contains the OAuth URL to redirect user
    res.json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone,role')
    .eq('id', userId)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', userId)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};
