let productsByID = {};
let currentProduct = null;
let isLoggedIn = false;

//Add Lambda URL and API key here!
let requestURL = "";
let apiKey = "";

async function getProducts(){    
    let productPromise = await fetch(
        requestURL,
        {
            "method": "GET",
            "headers": {
                "x-api-key": apiKey
            },
            "contentType": "text/plain"
        }
    );
    
    let productResponse = await productPromise;
    let productData = await productResponse.json();
   
    $("#ProductRow").empty();
    
    for (const product of productData){
        let newCol = $("<div>").addClass(["col", "border"]);
        
        let prodHeader = $("<h3>").text(product["name"].toUpperCase()).addClass("mx-auto")
        let titleDiv = $("<div>").append(prodHeader);
        newCol.append(titleDiv);
        
        let prodImage = $("<img>").attr("src", product["image"]).addClass(["rounded", "w-100"]);
        let imgDiv = $("<div>").append(prodImage);
        newCol.append(imgDiv);
        
        let prodPrice = $("<span>").text("$" + product["price"]);
        let priceDiv = $("<div>").append(prodPrice);
        newCol.append(priceDiv);
        
        newCol.click( function(){
            goDetailTab(product["productID"]);
        });
        
        productsByID[ product["productID"] ] = {
            Name: product["name"],
            Description: product["description"],            
            Price: '$' + product["price"],
            Stock: product["stock"],  
        };
        
        $("#ProductRow").append(newCol);
    }
    
    //ensure 3 cols per row
    for(let i = 0; i < ((3 - (productData.length % 3)) % 3); i++){
        let newCol = $("<div>").addClass("col");
        $("#ProductRow").append(newCol);
    }
}

function createDetailTable(productID){
    $("#DetailTable").empty();
    currentProductID = productID;
    let detailObject = productsByID[productID];
    let tableBody = $("<tbody>");
    
    for ( const [title, value] of Object.entries(detailObject) ){
        let row = $("<tr>");
        row.append( $("<th>").text(title.toUpperCase()) );
        row.append( $("<td>").text(value) );
        tableBody.append(row);
    }
    $("#DetailTable").append(tableBody);
}

function addToCart(){
    let productID = currentProductID;
    let quantity = $("#cartQty").val();
    console.log("Check out " + quantity + " of " + currentProductID);
    goProductTab();
}

function createCartTable(){
    //cart contents should contain cartList and cartPrice
    console.log("Getting cart contents");
    let cartPrice = 123.45;
    let cartList = [
        {"name": "item1", "price": 50.00, "quantity": 2, "productID": "A"},
        {"name": "item2", "price": 20.00, "quantity": 1, "productID": "B"},
        {"name": "item3", "price": 3.45, "quantity": 1, "productID": "C"},
    ];
    
    $("#CartTable").empty();
    
    let headerRow = $("<tr>");
    const colNames = ["Name", "Price", "Qty", "Edit"];
    for (const colName of colNames){
        headerRow.append( $("<th>").text(colName) );       
    }
    let tableHeader = $("<thead>").append(headerRow);
    $("#CartTable").append(tableHeader);
    
    let tableBody = $("<tbody>");    
    for ( const cartObject of cartList ){
        let row = $("<tr>");
        let incrButton = $("<button>").text("+").addClass("btn btn-success").click( function(){
            incrProduct(cartObject["productID"]);
        });
        let decrButton = $("<button>").text("-").addClass("btn btn-danger").click( function(){
            decrProduct(cartObject["productID"]);
        });
        let qtyButtons = $("<div>").append(incrButton).append(decrButton)
        row.append( $("<td>").text( cartObject["name"] ) );
        row.append( $("<td>").text( "$" + cartObject["price"].toFixed(2) ) );
        row.append( $("<td>").text( cartObject["quantity"] ) );
        row.append( $("<td>").append( qtyButtons ) );
        tableBody.append(row);
    }
    
    let priceRow = $("<tr>");
    priceRow.append( $("<th>").text( "Total" ) );
    priceRow.append( $("<td>").text( "$" + cartPrice.toFixed(2) ) );
    priceRow.append( $("<td>") );
    priceRow.append( $("<td>") );
    tableBody.append(priceRow);
    
    $("#CartTable").append(tableBody);
}

function clearCart(){
    console.log("Deleting all items from cart");
    
    createCartTable();          
}

function checkoutCart(){
    console.log("Checking out all items in cart");
    
    createCartTable(); 
}

function incrProduct(productID){
    console.log("Incrementing " + productID);
    createCartTable();    
}

function decrProduct(productID){
    console.log("Decrementing " + productID);
    createCartTable();
}

function initManagePage(){
    console.log("Initializing values");
}

function addItem(){
    console.log("Adding item");
}

function deleteItem(){
    console.log("Removing item");
}

function loadUpdateForm(productID){
    console.log("Updating form values");
}

function updateItem(){
    console.log("Updating item");
}

function Login(){
    //log in here
    isLoggedIn = true;
    $("#LoginNav").text("Logout")
    goProductTab();
}

function goLoginTab(){
    $("#DetailTab").hide();
    $("#ProductTab").hide();
    $("#CartTab").hide();
    $("#ManageTab").hide();
    $("#DetailNav").removeClass("active"); 
    $("#ProductNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
        
    //log out here
    isLoggedIn = false;
    $("#LoginNav").text("Login")
    
    $("#LoginNav").addClass("active");   
    $("#LoginTab").show();
}

function goDetailTab(productID){
    if(!isLoggedIn){
        //only change tab when logged in
        return;
    }
    
    $("#ProductTab").hide();
    $("#LoginTab").hide();
    $("#CartTab").hide();
    $("#ManageTab").hide();
    $("#LoginNav").removeClass("active"); 
    $("#ProductNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
    
    createDetailTable(productID);
    
    $("#DetailNav").addClass("active"); 
    $("#DetailTab").show();
};

function goProductTab(){
    if(!isLoggedIn){
        //only change tab when logged in
        return;
    }
    
    $("#DetailTab").hide();
    $("#LoginTab").hide();
    $("#CartTab").hide();
    $("#ManageTab").hide();
    $("#LoginNav").removeClass("active"); 
    $("#DetailNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
    
    getProducts();
    
    $("#ProductNav").addClass("active"); 
    $("#ProductTab").show();
}

function goCartTab(){
    if(!isLoggedIn){
        //only change tab when logged in
        return;
    }
    
    $("#DetailTab").hide();
    $("#LoginTab").hide();
    $("#ProductTab").hide();
    $("#ManageTab").hide();
    $("#LoginNav").removeClass("active"); 
    $("#DetailNav").removeClass("active"); 
    $("#ProductNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
    
    createCartTable();

    $("#CartNav").addClass("active"); 
    $("#CartTab").show();
}

function goManageTab(){
    if(!isLoggedIn){
        //only change tab when logged in
        return;
    }
    
    $("#DetailTab").hide();
    $("#LoginTab").hide();
    $("#CartTab").hide();
    $("#ProductTab").hide();
    $("#LoginNav").removeClass("active"); 
    $("#DetailNav").removeClass("active"); 
    $("#ProductNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    
    initManagePage();
    
    $("#ManageNav").addClass("active"); 
    $("#ManageTab").show();
}

//window.onload = (event) => {
    //getProducts();
//}