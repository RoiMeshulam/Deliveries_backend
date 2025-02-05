const {rtdb} = require('../firebase');

// Get all deliveries for a specific date
exports.getDeliveriesByDay = async (req, res) => {
    console.log("getDeliveriesByDay function");
    const { year, month, day } = req.params;
    
    try {
        const deliveriesRef = rtdb.ref(`deliveries/${year}/${month}/${day}`);
        const snapshot = await deliveriesRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).send('No deliveries found for the specified day');
        }

        const deliveriesData = snapshot.val();
        res.status(200).json(deliveriesData);
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).send('Error connecting to Realtime Database');
    }
};


// Get delivery by ID
exports.getDeliveryById = async (req, res) => {
    const { year, month, day, deliveryUID } = req.params;

    try {
        const deliveryRef = rtdb.ref(`deliveries/${year}/${month}/${day}/${deliveryUID}`);
        const snapshot = await deliveryRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).send('Delivery not found');
        }

        const deliveryData = snapshot.val();
        res.status(200).json(deliveryData);
    } catch (error) {
        console.error('Error fetching delivery by ID:', error);
        res.status(500).send('Error connecting to Realtime Database');
    }
};


// Get deliveries between two dates
exports.getDeliveriesBetweenDates = async (req, res) => {
    const { startDate, endDate } = req.query; // Expected format: YYYY-MM-DD

    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    try {
        const deliveriesRef = rtdb.ref('deliveries');
        const snapshot = await deliveriesRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).send('No deliveries found');
        }

        const allDeliveries = snapshot.val();
        const filteredDeliveries = {};

        for (const year in allDeliveries) {
            if (year >= startYear && year <= endYear) {
                for (const month in allDeliveries[year]) {
                    if (
                        (year == startYear && month >= startMonth) ||
                        (year == endYear && month <= endMonth) ||
                        (year > startYear && year < endYear)
                    ) {
                        for (const day in allDeliveries[year][month]) {
                            if (
                                (year == startYear && month == startMonth && day >= startDay) ||
                                (year == endYear && month == endMonth && day <= endDay) ||
                                (year > startYear && year < endYear) ||
                                (month > startMonth && month < endMonth)
                            ) {
                                if (!filteredDeliveries[year]) filteredDeliveries[year] = {};
                                if (!filteredDeliveries[year][month]) filteredDeliveries[year][month] = {};
                                filteredDeliveries[year][month][day] = allDeliveries[year][month][day];
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json(filteredDeliveries);
    } catch (error) {
        console.error('Error fetching deliveries in range:', error);
        res.status(500).send('Error connecting to Realtime Database');
    }
};


// Post a new delivery
exports.createDelivery = async (req, res) => {
    const { year, month, day } = req.params;
    const newDelivery = req.body;

    try {
        const deliveriesRef = rtdb.ref(`deliveries/${year}/${month}/${day}`);
        const newDeliveryRef = deliveriesRef.push();
        await newDeliveryRef.set(newDelivery);

        res.status(201).json({ message: 'Delivery created successfully', deliveryId: newDeliveryRef.key });
    } catch (error) {
        console.error('Error posting new delivery:', error);
        res.status(500).send('Error adding new delivery to Realtime Database');
    }
};

// Update a delivery
exports.updateDelivery = async (req, res) => {
    console.log("update Delivery function");
    const { year, month, day, deliveryUID } = req.params;
    const updatedData = req.body;
    console.log(updatedData);
    try {
        const deliveryRef = rtdb.ref(`deliveries/${year}/${month}/${day}/${deliveryUID}`);
        console.log(deliveryRef);
        const snapshot = await deliveryRef.once('value');
        console.log(snapshot);

        if (!snapshot.exists()) {
            return res.status(404).send('Delivery not found');
        }

        await deliveryRef.update(updatedData);
        res.status(200).json({ message: 'Delivery updated successfully' });
    } catch (error) {
        console.error('Error updating delivery:', error);
        res.status(500).send('Error updating delivery in Realtime Database');
    }
};


// Delete a delivery
exports.deleteDelivery = async (req, res) => {
    const { year, month, day, deliveryUID } = req.params;

    try {
        const deliveryRef = rtdb.ref(`deliveries/${year}/${month}/${day}/${deliveryUID}`);
        const snapshot = await deliveryRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).send('Delivery not found');
        }

        await deliveryRef.remove();
        res.status(200).json({ message: 'Delivery deleted successfully' });
    } catch (error) {
        console.error('Error deleting delivery:', error);
        res.status(500).send('Error deleting delivery from Realtime Database');
    }
};