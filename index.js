const express = require('express')
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app = express()
const cors  =  require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const PORT = process.env.PORT || 4000;


// middelware 
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g41pjic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
 
// nodemon --watch src --legacy-watch index.js

async function run() {
  try {
    await client.connect();

    const FoodCollection = client.db("FoodServices").collection("food");
    const bookigCollection = client.db("FoodServicesBooking").collection("booking");
    const towfoodBooking =  client.db("towFoodBooking").collection("towFood")
 

    //  middleware 
    // verfy token and access

     const gateman =  async(req,res,next)=>{
          const {token} =  req.cookies;
          // console.log(token);
          // if client does not send token
          if(!token){
            return res.status(401).send({massage:"you are not authorized!!!!!"});
          }
          
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
            if (err) {
              return res.status(401).send({massage:"you are not authorized"});
            }
            // console.log(decoded);
                 req.user = decoded;
            next();
          });
     }

      //  food services get  pagination / filtering/sortting krbo 
    //   http://localhost:4000/api/v1/services?name=pizza
    // https://food6239.wordpress.com/

      try{
             app.get("/api/v1/services", gateman, async(req,res)=>{
              let query  ={};
              let sort = {};
              const name  =  req.query.name;
                const sortField =  req.query.sortField;
                const sortOrder =  req.query.sortOrder;
                // console.log(sortField);console.log(sortOrder)

                // paginaction 
                const page  =  Number(req.query.page);
                const limit =  Number(req.query.limit);
                const skip = (page-1)*limit; 

              // console.log("Name:",name);
              if(name){
                query.name =  name;
              };
 
            if(sortField && sortOrder){
              sort[sortField] = sortOrder;
            };

              const services =  await FoodCollection.find(query).skip(skip).limit(limit).sort(sort).toArray();
              const total =  await FoodCollection.countDocuments();
            res.send({
              total,
              services,
             });
             })  
      }catch(error){
         console.log(error);
      }

         
         
    // tow food data get 

    try{
       app.get("/api/v1/towfood",async(req,res)=>{
          const towFood =  await towfoodBooking.find().toArray();
          res.send(towFood);
       })
    }catch(error){
      console.log(error);
    }

      // post methoad user create booking 
      try{
         app.post("/api/v1/user/create-booking",async(req,res)=>{
          const body =  req.body;
             const booking  =  await bookigCollection.insertOne(body);
            res.send(booking);
         })
      }catch(error){
        console.log(error);
      } 



      // user specific booking 
      try{
        app.get("/api/v1/user/bookings", gateman,async(req,res)=>{
        // console.log(req);
        //  console.log(req.query.email);
                   // console.log("token:",req.cookies.token);
               const queryEmail =  req.query.email;
               const tokenEmail = req.user.email;

             

         if(queryEmail !== tokenEmail){
          // const result =  await bookigCollection.findOne({email:queryEmail});
          return res.status(403).send({massage:"you forbedent"});
          // res.send(result);
         }

         let query = {};
          if(queryEmail){
            query.email = queryEmail;

          } 
          const result =  await bookigCollection.findOne(query).toArray;
           res.send(result);
        })
      }catch(error){
       console.log(error);
}
 
          
         
      // delete methoad user cencle-booking  
      try{
          app.delete("/api/v1/user/cencel-booking/:id",async(req,res)=>{
              const id  = req.params.id;
               const query = {
                _id: new ObjectId(id)
              };
               const deletedBooking =  await bookigCollection.deleteOne(query);
               res.send(deletedBooking);
          })
      }catch(error){
        console.log(error);
      }
        
      //   auth related kaj kormo jwt token
        try{
          app.post("/api/v1/auth/access-token",async(req,res)=>{
            const user =  req.body;
             console.log(user);

                   const token =  jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '900000000000h' });
            //  console.log(token);
             res.
                cookie("token",token,{
                  httpOnly: true,
                  secure: true ,
                  sameSite:'none',
                }).send({success:true}); 
          })
        }catch(error){
          console.log(error);
        }
        


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World i am food panda i need help!')
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})