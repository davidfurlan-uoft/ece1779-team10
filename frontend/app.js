let productsByID = {};
let currentProduct = null;
let id_token = null;
let access_token = null;
let isLoggedIn = false;
let toast = null;

const cognitoDomain = ""; // Cognito Hosted UI domain
const clientId = ""; // Cognito App Client ID
const clientSecret = "" //Cognito App Client secret
const redirectUri = ""; // S3 static website endpoint
const apiGatewayUrl = ""; // API Gateway base URL

async function exchangeCodeForTokens(authCode) {
    const url = `${cognitoDomain}/oauth2/token`;
    const data = {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: authCode,
        redirect_uri: redirectUri
    };

    const formBody = Object.keys(data)
        .map(key => key + '=' + encodeURIComponent(data[key]))
        .join('&');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        });
        
        const tokens = await response.json();
        
        if ( !("id_token" in tokens) ){
            throw new Error("Invalid code");            
        }
               
        id_token = tokens.id_token;
        access_token = tokens.access_token;              
        
        isLoggedIn = true;
        $("#LoginNav").text("Logout");         
    } catch (error) {
        $("#ToastMessage").text("Error logging in, please try again");
        toast.show();      
    }
}

async function getProducts(){    
    let productPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/products",
        {
            "method": "GET",
        }
    );
    
    let productResponse = await productPromise;
    let productData = await productResponse.json();
   
    $("#ProductRow").empty();
    productsByID = {};
    
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
            "name": product["name"],
            "description": product["description"],            
            "image": product["image"], 
            "price": Number(product["price"]),
            "stock": Number(product["stock"]),  
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
        if(title == "image"){
            //don't display image reference
            continue;
        }
        
        let row = $("<tr>");
        row.append( $("<th>").text(title.toUpperCase()) );
        if(title == "price"){
            row.append( $("<td>").text("$" + value) ); 
        }
        else {
            row.append( $("<td>").text(value) );
        }        
        tableBody.append(row);
    }
    $("#DetailTable").append(tableBody);
}

async function addToCart(){
    let productID = currentProductID;
    
    let quantity = $("#cartQty").val();
    if(!id_token){
        console.log("Please log in");
        goProductTab();
    }
    
    let addToCartPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/cart",
        {
            "method": "POST",            
            "body": JSON.stringify({
                "operation": "add",
                "productID": currentProductID,
                "quantity": quantity,
            }),
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let productResponse = await addToCartPromise;
    let statusData = await productResponse.json();
    
    $("#ToastMessage").text(statusData.message);
    toast.show();   
    
    goProductTab();
}

async function createCartTable(){
    $("#CartTable").empty();
    
    if(!id_token){
        $("#ToastMessage").text("Please log in!");
        toast.show();
        goProductTab();
    }
    
    let cartPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/cart",
        {
            "method": "GET",            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();
    
    let cartList = [];
    let cartPrice = 0.0;
    for ( const [pid, qty] of Object.entries(cartData) ){
        cartItem = {
            "name": productsByID[pid]["name"],
            "price": productsByID[pid]["price"],
            "quantity": qty,
            "productID": pid,            
        }
        cartPrice += cartItem["quantity"] * cartItem["price"];
        cartList.push(cartItem);
    }
    
    let headerRow = $("<tr>");
    const colNames = ["Name", "Price", "Qty", "Update Qty", "Delete Item"];
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
        let delButton = $("<button>").text("X").addClass("btn btn-danger").click( function(){
            delProduct(cartObject["productID"]);
        });
        let qtyButtons = $("<div>").append(incrButton).append(decrButton)
        row.append( $("<td>").text( cartObject["name"] ) );
        row.append( $("<td>").text( "$" + cartObject["price"].toFixed(2) ) );
        row.append( $("<td>").text( cartObject["quantity"] ) );
        row.append( $("<td>").append( qtyButtons ) );
        row.append( $("<td>").append( delButton ) );
        tableBody.append(row);
    }
    
    let priceRow = $("<tr>");
    priceRow.append( $("<th>").text( "Total" ) );
    priceRow.append( $("<td>").text( "$" + cartPrice.toFixed(2) ) );
    priceRow.append( $("<td>") );
    priceRow.append( $("<td>") );
    priceRow.append( $("<td>") );
    tableBody.append(priceRow);
    
    $("#CartTable").append(tableBody);
}

async function clearCart(){    
    if(!id_token){
        $("#ToastMessage").text("Please log in!");
        toast.show();
        goProductTab();
    }
    
    let cartPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/cart",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "deleteall",
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();    
        
    $("#ToastMessage").text(cartData.message);
    toast.show(); 
    
    createCartTable();          
}

async function checkoutCart(){
    if(!id_token){
        $("#ToastMessage").text("Please log in!");
        toast.show(); 
        goProductTab();
    }
    
    let cartPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/cart",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "checkout",
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();
                
    $("#ToastMessage").text(cartData.message);
    toast.show(); 
    
    createCartTable(); 
}

async function incrProduct(productID){
    let cartPromise = await fetch(
        apiGatewayUrl + "/cart",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "add",
                "productID": productID,
                "quantity": 1,
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();
                
    $("#ToastMessage").text(cartData.message);
    toast.show();
    
    createCartTable();    
}

async function decrProduct(productID){    
    let cartPromise = await fetch(
        apiGatewayUrl + "/cart",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "add",
                "productID": productID,
                "quantity": -1,
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();
            
    $("#ToastMessage").text(cartData.message);
    toast.show();
    
    createCartTable();
}

async function delProduct(productID){
    let cartPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/cart",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "delete",
                "productID": productID,
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let cartResponse = await cartPromise;
    let cartData = await cartResponse.json();
    
    $("#ToastMessage").text(cartData.message);
    toast.show();
    
    createCartTable();
}

function initManagePage(){        
    $("#removeSelect").empty();    
    $("#removeSelect").append(
        $("<option>")
        .text("Select a Product")
        .attr({"disabled": true, "selected": true, "value": ""})
    );
    
    $("#editSelect").empty();
    $("#editSelect").append(
        $("<option>")
        .text("Select a Product")
        .attr({"disabled": true, "selected": true, "value": ""})
    );
    
    for ( const [prodID, prodInfo] of Object.entries(productsByID) ){
        $("#removeSelect").append(
            $("<option>")
            .text(prodID)
            .attr("value", prodID)            
        );
        $("#editSelect").append(
            $("<option>")
            .text(prodID)
            .attr("value", prodID)
        );
    }

    $("#addFormID").val("");
    $("#addFormName").val("");
    $("#addFormImage").val("");
    $("#addFormPrice").val("");
    $("#addFormStock").val("");
    $("#addFormDesc").val("");
    
    $("#editFormName").val("");
    $("#editFormDesc").val("");
    $("#editFormImage").val("");
    $("#editFormStock").val("");
    $("#editFormPrice").val("");      
}

async function addItem(){    
    const prodID = $("#addFormID").val();
    const prodName = $("#addFormName").val();
    const prodImage = $("#addFormImage").val();
    const prodPrice = $("#addFormPrice").val();
    const prodStock = $("#addFormStock").val();
    const prodDesc = $("#addFormDesc").val();
    
    let itemPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/manage",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "add",
                "ProductInfo": {
                    "productID": prodID,
                    "name": prodName,
                    "image": prodImage,
                    "price": prodPrice,
                    "stock": prodStock,
                    "description": prodDesc,                    
                }
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let itemResponse = await itemPromise;
    let itemData = await itemResponse.json();
    
    $("#ToastMessage").text(itemData.message);
    toast.show();
           
    await getProducts();
    initManagePage();
}

async function deleteItem(){
    const prodID = $("#removeSelect").val();
    
    let itemPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/manage",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "delete",
                "ProductInfo": {
                    "productID": prodID,                   
                }
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let itemResponse = await itemPromise;
    let itemData = await itemResponse.json();
    
    $("#ToastMessage").text(itemData.message);
    toast.show();
    
    await getProducts();
    initManagePage();
}

function loadUpdateForm(productID){
    selectedID = $("#editSelect").val();
     
    let productInfo = productsByID[selectedID];
    $("#editFormName").val(productInfo["name"]);
    $("#editFormDesc").val(productInfo["description"]);
    $("#editFormImage").val(productInfo["image"]);
    $("#editFormStock").val(productInfo["stock"]);
    $("#editFormPrice").val(productInfo["price"]);  
}

async function updateItem(){    
    const prodID = $("#editSelect").val();
    const prodName = $("#editFormName").val();
    const prodImage = $("#editFormImage").val();
    const prodPrice = $("#editFormPrice").val();
    const prodStock = $("#editFormStock").val();
    const prodDesc = $("#editFormDesc").val();
    
    let itemPromise = await fetch(
        //requestURL,
        apiGatewayUrl + "/manage",
        {
            "method": "POST",
            "body": JSON.stringify({
                "operation": "update",
                "ProductInfo": {
                    "productID": prodID,
                    "name": prodName,
                    "image": prodImage,
                    "price": prodPrice,
                    "stock": prodStock,
                    "description": prodDesc,                    
                }
            }),            
            "headers": {
                "Content-type": "application/json",
                "Authorization": id_token,
            }            
        }
    );
    
    let itemResponse = await itemPromise;
    let itemData = await itemResponse.json();
    
    $("#ToastMessage").text(itemData.message);
    toast.show();
    
    await getProducts();
    initManagePage();    
}

function Login(){
    //log in here
    const loginUrl = `${cognitoDomain}/login?response_type=code`
        + `&client_id=${encodeURIComponent(clientId)}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&scope=email+openid+phone`;
    window.location.href = loginUrl;
}

function Logout() {
    //log out here
    const logoutUrl = `${cognitoDomain}/logout?client_id=${encodeURIComponent(clientId)}`
        + `&logout_uri=${encodeURIComponent(redirectUri)}`;
    
    id_token = null;
    access_token = null;        
    isLoggedIn = false;    
    $("#LoginNav").text("Login"); 
    
    window.location.href = logoutUrl;
}

function goLoginTab(){
    if(isLoggedIn){
        Logout() 
    }
    else{
        Login();
    }
}

function goDetailTab(productID){
    if(!isLoggedIn){
        //only change tab when logged in
        $("#ToastMessage").text("Please log in!");
        toast.show();        
        return;
    }
    
    $("#ProductTab").hide();
    $("#CartTab").hide();
    $("#ManageTab").hide(); 
    $("#ProductNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
    
    createDetailTable(productID);
    
    $("#DetailNav").addClass("active"); 
    $("#DetailTab").show();
};

function goProductTab(){    
    $("#DetailTab").hide();
    $("#CartTab").hide();
    $("#ManageTab").hide();
    $("#DetailNav").removeClass("active"); 
    $("#CartNav").removeClass("active"); 
    $("#ManageNav").removeClass("active"); 
    
    $("#cartQty").val(1);    
    getProducts();
    
    $("#ProductNav").addClass("active"); 
    $("#ProductTab").show();
}

function goCartTab(){
    if(!isLoggedIn){
        //only change tab when logged in
        $("#ToastMessage").text("Please log in!");
        toast.show();        
        return;
    }
    
    $("#DetailTab").hide();
    //$("#LoginTab").hide();
    $("#ProductTab").hide();
    $("#ManageTab").hide();
    //$("#LoginNav").removeClass("active"); 
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
        $("#ToastMessage").text("Please log in!");
        toast.show();        
        return;
    }
    
    $("#DetailTab").hide();
    //$("#LoginTab").hide();
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

window.onload = (event) => {
    //check if returning from a login
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    if (authCode) {
        exchangeCodeForTokens(authCode);
    }
    
    //initialize toast
    toast = new bootstrap.Toast($("#ToastDiv"));
    
    //load main page
    goProductTab();
}