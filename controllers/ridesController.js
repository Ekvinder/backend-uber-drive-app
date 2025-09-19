const supabase = require('../config/supabase');


// Create a new ride request
exports.createRide = async (req, res) => {
  const user_id = req.user.id;
  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,  } = req.body;
  if (
    pickup_lat === undefined || pickup_lng === undefined ||
    dropoff_lat === undefined || dropoff_lng === undefined
  ) {
    return res.status(400).json({ error: 'Pickup and dropoff coordinates are required' });
  }
  try {
    const { data, error } = await supabase
      .from('rides')
      .insert([
        {
          user_id,
          pickup_lat,
          pickup_lng,
          dropoff_lat,
          dropoff_lng,
          
          status: 'requested',
          requested_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ message: 'Ride requested', ride: data });
  } catch (err) {
    res.status(500).json({error:'server error'});
  }
};

// Get rides for logged-in user
exports.getUser_Rides = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('user_id', user_id)
      .order('requested_at', { ascending: false });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ rides: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'requested')
      .is('driver_id', null)
      .order('requested_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ rides: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


exports.acceptRide = async (req, res) => {
  const driver_id = req.user.id;
  const { rideId } = req.params;

  try {
    // First, fetch the ride to check availability
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (ride.status !== 'requested' || ride.driver_id) {
      return res.status(400).json({ error: 'Ride is no longer available' });
    }

    // Update ride with driver_id and status
    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id,
        status: 'accepted',
        started_at: null,
        completed_at: null,
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ride accepted', ride: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.startRide = async (req, res) => {
  const driver_id = req.user.id;
  const { rideId } = req.params;

  try {
    // Fetch ride to verify driver ownership and status
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (ride.driver_id !== driver_id) {
      return res.status(403).json({ error: 'You are not assigned to this ride' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ error: 'Ride cannot be started in current status' });
    }

    // Update ride status and started_at timestamp
    const { data, error } = await supabase
      .from('rides')
      .update({
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ride started', ride: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.completeRide = async (req, res) => {
  const driver_id = req.user.id;
  const { rideId } = req.params;

  try {
    // Fetch ride to verify driver ownership and status
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (ride.driver_id !== driver_id) {
      return res.status(403).json({ error: 'You are not assigned to this ride' });
    }

    if (ride.status !== 'started') {
      return res.status(400).json({ error: 'Ride cannot be completed in current status' });
    }

    // Update ride status and completed_at timestamp
    const { data, error } = await supabase
      .from('rides')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ride completed', ride: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};