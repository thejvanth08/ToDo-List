//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// we are not going to use this; const date = require(__dirname + "/date.js"); //requiring is different as our module is locally coded not installed from internet
const app = express();

app.set('view engine', 'ejs'); //it tells that app which is generated using express has to use ejs as it's view engine
//it's must be below app initialize line

app.use(bodyParser.urlencoded({extended: true}));//setting up body-parser to be used
app.use(express.static("public"));//(explicitly telling express) to serve the css file inside public folder as static file and visible in localhost

mongoose.connect("mongodb+srv://Thejvanth:thejvanth2004@cluster0.oys6ory.mongodb.net/todolistDB");//this url is where mongodb will connect locally

const itemsSchema = {//schema for items
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema] //array of itemsSchema based or dependent items; embedding a document in another; creating relationship
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("item", itemsSchema); //creating model for itemsSchema and item -> singular version of our collection name

const item1 = new Item({
  name: "Welcome to your To-do List"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3= new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];//putting those default items into an array
app.get("/",function(req, res){
Item.find({}, function(err, foundItems){
  if (foundItems.length === 0){ // when no items in collection(items) for avoiding
    Item.insertMany(defaultItems, function(err){ //inserting our item arr into our items collection in database
     if(err){
       console.log(err);
     } else{
       console.log("Successful inserted defaultItems when items collection is empty.");
     }
   });
   res.redirect("/");//it again redirect to home route after inserting once, it renders the default items
 } else { // after inserting defaultItems once, it will render the home page
  res.render("list", {listTitle: "Today", newListItems: foundItems});//to simplify we changing the code
}
});
//it renders .ejs html file named list, holds the value of day in place of marker nameOfDay
//newListItem will be displayed after the post request (getting input from the user); It's going to send the array of items from inputs we enter
});

app.post("/",function(req,res){
  //console.log(req.body); //this displays the inputs, also the button:
  const itemName = req.body.newItem;//grapping from the input from form
  const listName = req.body.list;//getting the listName from the input
   const item = new Item({
   name: itemName
 });
if(listName === "Today"){ // when listName is Today, we redirect to same home route
item.save();//to add this document
res.redirect("/");//to show the new item added in the page, after added into db
} else{ //when it's a new custom list (name)
  List.findOne({name: listName}, function(err, foundList){ //finding the customList from collection lists
    foundList.items.push(item); //foundList-> it's the document; foundList.items -> array of items; this pushes new item which use just now typed to the array of items of custom list
    foundList.save();//this adds the new item to the document
    res.redirect("/" + listName);//which renders the customList's page where we add new items
  });
}
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox; //id of the checked item will be assigned
  const listName = req.body.listName;//we also wants to get the listName from hidden input in ejs file, for checking to which list the items belongs to

  if(listName === "Today"){ //when delete request is from home list
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){ // not generate an error
        console.log("Successfully removed the item which is checked.");
        res.redirect("/");//again redirecting to home route will remove the item from page and display other items in list
      }
    });
  } else { //when delete request if from custom list
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}},function(err, foundList){ //pulling from items arr which has _id value of checkedItemId
      if(!err){
        res.redirect("/" + listName);//path of customList
      }
    }); //items is array in the lists document
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){ //it's different from find() which returns array of documents
    if(!err){
      if (!foundList){ //when customListName is not found; foundList -> name we enter to check or create
        //create new list of that customListName
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();//saving the list name, default items in the database
        res.redirect("/" + customListName); //showing the page after entering new custom lists; this is very important for creating more one custom list
      } else{
        //show already exisiting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});//these will rendered by sending these values to the list.ejs page

      }
    }//check the pairs of curly braces; if not given properly may generate error
    });
});

app.get("/about", function(req,res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Sever 3000 is running");// when our app is listening to port no. 3000 it will log this
});
