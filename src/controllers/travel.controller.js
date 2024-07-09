import { Travel } from '../models/Travelmodel.js';
import { Apierror } from '../utils/Apierror.js';
import { asynchandler } from '../utils/asynchandler.js';
import { Apiresponse } from '../utils/Apiresponse.js';

const travelData = asynchandler(async(req,res)=>{
   const{budget,tripLocation,region,travelBy,stayOption,famousplace} = req.body

   if(budget,region,travelBy === ""){
    throw new Apierror(400,"all fields are required")
  }

   const travel = await Travel.create({
    budget,
    tripLocation,
    region,
    travelBy,
    stayOption,
    famousplace
   })
   if(!travel){
     throw new Apierror(200,"travel data not saved")
   }
   return res.status(201).json(
    new Apiresponse(200, travel, "travel data saved")
   )
})

const travelFinder = asynchandler(async(req,res)=>{
  const { budget, travelBy } = req.body;
console.log(req.body); // Log the request body

try {
 
  if (!budget || !travelBy) {
    return res.status(400).json({ message: 'Budget and travel method are required.' });
  }
  let selectedTravelMethods = travelBy; // This should be an array of user-selected travel methods

  let travel = await Travel.find({
    budget: budget,
    travelBy: { $in: selectedTravelMethods } // Match any travel method in the provided array
  });
  
  // Ensure travelBy is an array to handle multiple travel methods
  const travelMethods = Array.isArray(travelBy) ? travelBy : [travelBy];


  // If no exact budget match, find data with budget less than or equal to provided budget
  if (!travel || travel.length === 0) {
    travel = await Travel.find({
      budget: { $lte: budget },
      travelBy: { $in: travelMethods } // Match any travel method in the provided array
    });
  }

  // Check if no travel options are found
  if (!travel || travel.length === 0) {
    return res.status(404).json({ message: 'No travel options found within the given criteria.' });
  }

  // Function to format values
  const formatValues = (values) => {
    if (Array.isArray(values)) {
      return values.join(', ');
    }
    return values;
  };

  // Format the travel data
  const formattedTravel = travel.map(item => ({
    ...item._doc,
    stayOption: formatValues(item.stayOption), // Replace 'stayOption' with the actual field name
    famousplace: formatValues(item.famousplace),
    travelBy: formatValues(item.travelBy) // Replace 'travelBy' with the actual field name
    // Repeat for other fields that need formatting
  }));

  // Send the formatted travel data as a response
  return res.status(200).json(
    new Apiresponse(200, formattedTravel, "Travel places found")
  );
} catch (error) {
  console.error('Error fetching travel options:', error); // Log the error
  return res.status(500).json({ message: 'Internal Server Error' });
}

})

export{travelData,travelFinder}