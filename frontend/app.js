let productsByID = {};
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
    
    getProducts();

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
    
    getProducts();
    
    $("#ManageNav").addClass("active"); 
    $("#ManageTab").show();
}

//window.onload = (event) => {
    //getProducts();
//}