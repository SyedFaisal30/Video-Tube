import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load environment variables
dotenv.config({ path: "./.env" });

// Connect to MongoDB
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is Running at port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MONGO DB Connection Failed:", err);
  });





// const app=express()
// (
//   async ()=>{
//     try{
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       app.on("error",(error)=>{
//         console.log("Error ",error);
//         throw error
//       })

//       app.listen(process.env.PORT,()=>{
//         console.log(`App listening on port ${process.env.PORT}`);
//       })
//     }
//     catch(error){
//       console.error("ERROR ",error)
//     }
//   }
// )