const { firestoreDb } = require("../firebase"); // Import Firestore instance

// Get all businesses
const getBusinesses = async (req, res) => {
  try {
    const businessesSnapshot = await firestoreDb.collection("businesses").get();
    if (businessesSnapshot.empty) {
      return res.status(404).json({ message: "No businesses found" });
    }

    const businesses = businessesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(businesses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get business by ID
const getBusinessById = async (req, res) => {
  const { businessUID } = req.params;
  try {
    const businessDoc = await firestoreDb.collection("businesses").doc(businessUID).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ message: "Business not found" });
    }

    return res.status(200).json({ id: businessDoc.id, ...businessDoc.data() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Create a new business
const createBusiness = async (req, res) => {
  const { name, description, ownerUID } = req.body; // Include owner UID if applicable

  try {
    const newBusiness = {
      name,
      description,
      ownerUID,
      createdAt: new Date(),
    };

    const businessRef = await firestoreDb.collection("businesses").add(newBusiness);

    return res.status(201).json({ message: "Business created successfully", id: businessRef.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update business details
const updateBusiness = async (req, res) => {
  const { businessUID } = req.params;
  const { name, description } = req.body;

  try {
    const businessRef = firestoreDb.collection("businesses").doc(businessUID);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      return res.status(404).json({ message: "Business not found" });
    }

    await businessRef.update({ name, description });

    return res.status(200).json({ message: "Business updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete a business
const deleteBusiness = async (req, res) => {
  const { businessUID } = req.params;

  try {
    const businessRef = firestoreDb.collection("businesses").doc(businessUID);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      return res.status(404).json({ message: "Business not found" });
    }

    await businessRef.delete();

    return res.status(200).json({ message: "Business deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
