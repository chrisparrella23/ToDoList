const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// default items
const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  //List sidenav experiment
  const existingLists = [];
  List.find({}, function(err, foundLists) {
    existingLists.push(foundLists);

    Item.find({}, function(err, foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB.");
          }
            res.redirect("/");
        });
        //res.redirect("/"); was originally here; fixed BulkWriteError by moving it to above location
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems, existingLists: foundLists});
      }
    });
  });
});

app.get("/:customListName", function(req, res) {
  //sidenav experiment
  const existingLists = [];
  List.find({}, function(err, foundLists) {
    existingLists.push(foundLists);

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(function(err, result) {
          res.redirect("/" + customListName);
        });

      } else {
        // Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items, existingLists: foundLists});
      }
    }
  });
});
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save(function(err, result) {
      res.redirect("/");
    });

  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save(function(err, result) {
        res.redirect("/" + listName);
      });

    });
  }

});

app.post("/listRedirect", function(req, res) {
  const listName = req.body.newListName;
  const customListName = _.capitalize(listName);

  const existingLists = [];
  List.find({}, function(err, foundLists) {
    existingLists.push(foundLists);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(function(err, result) {
          res.redirect("/" + customListName);
        });

      } else {
        // Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items, existingLists: foundLists});
      }
    }
  });
});
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted the selected document from DB.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

// app.get("/work", function(req, res) {
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
//
// app.get("/about", function(req, res) {
//   res.render("about");
// });

// Made obsolete by the if statement at line 25
// app.post("/work", function(req, res) {
//   const item = req.body.newItem;
//   workItems.push(item);
//   res.redirect("/work");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
