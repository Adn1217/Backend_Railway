const normalize = window.normalizr.normalize;
const schema = window.normalizr.schema;
const denormalize = window.normalizr.denormalize;
let port='';
if (port){
    port =`:${port}`
}
const server ='backendrailway.up.railway.app';
const uri = `https://${server}${port}`;

function checkInputs(){
    if(titleInput.value === '' || codeInput.value === '' || priceInput.value === ''
       || stockInput.value === ''|| thumbnailInput.value === ''){
        titleInput.classList.add('errorInput');
        codeInput.classList.add('errorInput');
        priceInput.classList.add('errorInput');
        stockInput.classList.add('errorInput');
        thumbnailInput.classList.add('errorInput');
        results.classList.add('errorLabel');
        results.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
        return false
    }else{
        titleInput.classList.remove('errorInput');
        codeInput.classList.remove('errorInput');
        priceInput.classList.remove('errorInput');
        stockInput.classList.remove('errorInput');
        thumbnailInput.classList.remove('errorInput');
        idInput.classList.remove('errorInput');
        results.classList.remove('errorLabel');
        results.innerHTML='';
        return true
    }
}

function checkMsgInputs(fields){
    
    let invalide = false;
    fields.forEach((field) => {
            if (field.value === ''){
                field.classList.add('errorInput');
                invalide = true;
            }
        })
    if(invalide){
        results.classList.add('errorLabel');
        results.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
        return false
    }else{
        fields.forEach((field) => {
            field.classList.remove('errorInput');
        })
        if (results.classList.contains("errorLabel")) {
            results.classList.remove("errorLabel");
            results.innerHTML = "";
          }
        return true
    }
}
//-----------PRODUCTS FORM -------------------------
async function submitForm(id) {
    let valideInputs = checkInputs();
    if(valideInputs){
        let newProd = {
            code: codeInput.value,
            title: titleInput.value,
            description: descriptionInput.value,
            price: priceInput.value,
            stock: stockInput.value,
            thumbnail: thumbnailInput.value,
        }
        let url = `${uri}/productos`;
        let verb = 'POST';
        id && (url = url + `/${id}`);
        id && (verb = 'PUT');
        let response = await fetch(url, { method: verb,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: productRolRadioButton.checked
            },
            body: JSON.stringify(newProd)
        })
        let prod = await response.json();
        if (("error" in prod)){
            results.classList.add('errorLabel');
            results.innerHTML=`<h1>Error</h1>${JSON.stringify(prod)}</p>`;
            if (prod.error === 'Usuario no autenticado'){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            results.classList.remove('errorLabel');
            socket.emit("productRequest", "msj");
            idInput.value = '';
            [titleInput.value, descriptionInput.value, codeInput.value, priceInput.value, stockInput.value, thumbnailInput.value] = ['','','','','',''];
        }
        console.log(prod);
    }
}

async function updateProduct(id){
    if (id === ''){
        idInput.classList.add('errorInput');
    }else{
        idInput.classList.remove('errorInput');
    }
    await submitForm(id);
}

async function getAllProducts(){
    // console.log('Cookies: ', document.cookie);
    results.classList.remove('errorLabel');
    let response = await fetch(`${uri}/productos/`, { method: 'GET',
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        }
    })
    let prods = await response.json();
    // console.log("productos: ",prods)
    if(prods.error === 'Usuario no autenticado'){
        results.classList.add('errorLabel');
        results.innerHTML=`<h1>Error</h1>${JSON.stringify(prods)}</p>`;
        setTimeout(() => {
            location.href=`${uri}/login`
        }, 2000);
    }else{
        results.innerHTML= tableRender(prods);
    }
}

async function getAllRandomProducts(){
    results.classList.remove('errorLabel');
        let response = await fetch(`${uri}/productos-test/`, { method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        })
        let prods = await response.json();
        // console.log("productos: ",prods)
    if ("error" in prods){
        results.classList.add('errorLabel');
        results.innerHTML=`<h1>Error</h1>${JSON.stringify(prods)}</p>`;
        setTimeout(() => {
            location.href=`${uri}/login`
        }, 2000);
    }else{
        results.innerHTML= tableRender(prods);
    }
}

async function getOneProduct(id){
    if (id === ''){
        idInput.classList.add('errorInput');
        results.classList.add('errorLabel');
        results.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        idInput.classList.remove('errorInput');
        results.classList.remove('errorLabel');
        let response = await fetch(`${uri}/productos/${id}`, { method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        })
        let prod = await response.json();
        if (("error" in prod)){
            results.classList.add('errorLabel');
            results.innerHTML=`<h1>Error</h1>${JSON.stringify(prod)}</p>`;
            if (prod.error === 'Usuario no autenticado'){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            results.classList.remove('errorLabel');
            results.innerHTML= tableRender(prod.producto);
        }
        console.log(prod);
    // socket.emit('oneProductRequest', parseInt(id));
    }

}

async function deleteOneProduct(id){
    if (id === ''){
        idInput.classList.add('errorInput');
        results.classList.add('errorLabel');
        results.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        idInput.classList.remove('errorInput');
        results.classList.remove('errorLabel');
        let response = await fetch(`${uri}/productos/${id}`, { method: 'DELETE',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: productRolRadioButton.checked
            }
        })
        let prod = await response.json();
        if (("error" in prod)){
            console.log("Error", prod);
            results.classList.add('errorLabel');
            results.innerHTML=`<h1>Error</h1>${JSON.stringify(prod)}</p>`;
            if (prod.error === 'Usuario no autenticado'){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            console.log("Producto eliminado: ", prod);
            results.classList.remove('errorLabel');
            socket.emit("productRequest", "msj");
            idInput.value = '';
        }
    }
}


//---------CARTS FORM----------------------------------

async function saveCart(user){
    if(user===''){
        cartUserInput.classList.add('errorInput');
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        let newCart = {
            usuario: user,
            productos: []
        }
        cartResults.classList.remove('errorLabel');
        cartUserInput.classList.remove('errorInput');
        idCartInput.classList.remove('errorInput');
        idProdInput.classList.remove('errorInput');
        let response = await fetch(`${uri}/carrito/?`, { method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: true 
            },
            body: JSON.stringify(newCart)
        })
        let carts = await response.json();
        console.log("Nuevo carrito: ", carts)
        if (carts.error === 'Usuario no autenticado'){
            cartResults.classList.add('errorLabel');
            cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(carts)}</p>`;
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
        }else{
            // results.innerHTML= tableRender(carts);
            cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>NuevoCarrito: <br></strong>${JSON.stringify(carts)}</p>`;
            cartUserInput.value = '';
            idCartInput.value = '';
            idProdInput.value = '';
        }
    }
}

async function saveProdInCart(idCart){
    let valideInputs = checkInputs();
    if((valideInputs && idCart !== '')){
        let newProd = {
                code: codeInput.value,
                title: titleInput.value,
                description: descriptionInput.value,
                price: priceInput.value,
                stock: stockInput.value,
                thumbnail: thumbnailInput.value,
                }
        cartResults.classList.remove('errorLabel');
        cartUserInput.classList.remove('errorInput');
        idCartInput.classList.remove('errorInput');
        idProdInput.classList.remove('errorInput');
        let response = await fetch(`${uri}/carrito/${idCart}/productos`, { method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: true
            },
            body: JSON.stringify(newProd)
        })
        let carts = await response.json();
        console.log("Nuevo carrito: ",carts);
        if (carts.error === 'Usuario no autenticado'){
            cartResults.classList.add('errorLabel');
            cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(carts)}</p>`;
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
        }else{
            // results.innerHTML= tableRender(carts);
            cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>CarritoActualizado: <br></strong>${JSON.stringify(carts)}</p>`;
            cartUserInput.value = '';
            idCartInput.value = '';
            idProdInput.value = '';
            [titleInput.value, descriptionInput.value, codeInput.value, priceInput.value, stockInput.value, thumbnailInput.value] = ['','','','','',''];
        }
    }else{
        idCartInput.classList.add('errorInput');
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }
}

async function getAllCarts(){
    cartResults.classList.remove('errorLabel');
    idCartInput.classList.remove('errorInput');
    idProdInput.classList.remove('errorInput');
    let response = await fetch(`${uri}/carrito/?`, { method: 'GET',
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        }
    })
    let carts = await response.json();
    console.log("Carritos: ",carts)
    if (carts.error === 'Usuario no autenticado'){
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(carts)}</p>`;
            setTimeout(() => {
                location.href=`${uri}/login`
            }, 2000);
    }else{
    // results.innerHTML= tableRender(carts);
    cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>Carritos: <br></strong>${JSON.stringify(carts)}</p>`;
    idCartInput.value = '';
    idProdInput.value = '';
    [titleInput.value, descriptionInput.value, codeInput.value, priceInput.value, stockInput.value, thumbnailInput.value] = ['','','','','',''];
    }
}

async function getOneCart(id){
    if (id === ''){
        idCartInput.classList.add('errorInput');
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        idCartInput.classList.remove('errorInput');
        idProdInput.classList.remove('errorInput');
        cartResults.classList.remove('errorLabel');
        let response = await fetch(`${uri}/carrito/${id}/productos`, { method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        })
        let cart = await response.json();
        if (("error" in cart)){
            cartResults.classList.add('errorLabel');
            cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(cart)}</p>`;
            if (cart.error === "Usuario no autenticado"){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            cartResults.classList.remove('errorLabel');
            // cartResults.innerHTML= tableRender(prod.producto);
            cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>ProductosCarrito${id}: <br></strong>${JSON.stringify(cart)}</p>`;
            idCartInput.value = '';
        }
        idProdInput.value = '';
        console.log(cart);
        // socket.emit('oneProductRequest', parseInt(id));
    }
}

async function deleteOneProductInCart(idCart, idProd){
    if (idCart === '' || idProd === ''){
        idCartInput.classList.add('errorInput');
        idProdInput.classList.add('errorInput');
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        idCartInput.classList.remove('errorInput');
        idProdInput.classList.remove('errorInput');
        cartResults.classList.remove('errorLabel');
        cartResults.classList.remove('errorLabel');
        let response = await fetch(`${uri}/carrito/${idCart}/productos/${idProd}`, { method: 'DELETE',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: true
            }
        })
        let prod = await response.json();
        if (("error" in prod)){
            console.log("Error", prod);
            cartResults.classList.add('errorLabel');
            cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(prod)}</p>`;
            if (prod.error === "Usuario no autenticado"){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            console.log("Producto eliminado: ", prod);
            cartResults.classList.remove('errorLabel');
            cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>ProductoEliminadoDelCarrito${idCart}: <br></strong>${JSON.stringify(prod)}</p>`;
            // socket.emit("productRequest", "msj");
            idCartInput.value = '';
            idProdInput.value = '';
        }
    }
}

async function deleteOneCart(id){
    if (id === ''){
        idCartInput.classList.add('errorInput');
        cartResults.classList.add('errorLabel');
        cartResults.innerHTML=`<p>Los campos resaltados son obligatorios</p>`;
    }else{
        idCartInput.classList.remove('errorInput');
        idProdInput.classList.remove('errorInput');
        cartResults.classList.remove('errorLabel');
        let response = await fetch(`${uri}/carrito/${id}`, { method: 'DELETE',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Auth: true
            }
        })
        let cart = await response.json();
        if (("error" in cart)){
            console.log("Error", cart);
            cartResults.classList.add('errorLabel');
            cartResults.innerHTML=`<h1>Error</h1>${JSON.stringify(cart)}</p>`;
            if (cart.error === "Usuario no autenticado"){
                setTimeout(() => {
                    location.href=`${uri}/login`
                }, 2000);
            }
        }else{
            console.log("Carrito eliminado: ", cart);
            results.classList.remove('errorLabel');
            // socket.emit("productRequest", "msj");
            cartResults.innerHTML=`<h1>Respuesta</h1><p><strong>Carrito${id}Eliminado: <br></strong>${JSON.stringify(cart)}</p>`;
            idCartInput.value = '';
            idProdInput.value = '';
        }
    }
}


//-----------MESSAGES----------------------------------------
async function sendMessage() {
    const fields = [userInput, msgInput];
    let valideInputs = checkMsgInputs(fields);
    if(valideInputs){
        let newMessage = {
            // fecha: new Date().toLocaleString("en-GB"),
            fecha: new Date(),
            usuario: userInput.value,
            mensaje: msgInput.value
        }
        let url = `${uri}/mensajes`;
        let verb = 'POST';
        let response = await fetch(url, { method: verb,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMessage)
        })
        let data = await response.json();
        !("error" in data) && ([msgInput.value] = ['']);
        // console.log(data);

        if (data?.error === "Usuario no autenticado"){
            console.log("Error", data);
            results.classList.add('errorLabel');
            results.innerHTML=`<h1>Error</h1>${JSON.stringify(data)}</p>`;
            setTimeout(() => {
                location.href=`${uri}/login`
            }, 2000);
        }else{
            socket.emit('messageRequest','msj')
        }
    }
}

function normalizeMessage(msg){
    const authorSchema = new schema.Entity('authorSchema',{}, {idAttribute: 'id'});
    const messageSchema = new schema.Entity('messageSchema',{
        author: authorSchema
    }, {idAttribute: 'author'})
    const msgsSchema = new schema.Entity('msgsSchema',{
        messages: [messageSchema]
    }, {idAttribute: 'messages'} );
    const normalizedMessage = normalize(msg, msgsSchema);
    const denormalizedMessage = denormalize(normalizedMessage.result, msgsSchema, normalizedMessage.entities);
    return [normalizedMessage, denormalizedMessage];
}

function createMessage() {
    let newMessage = {
        type: 'msgList',
        messages: [
            {
                author: {
                    id: userIdInput.value,
                    nombre: userInput.value,
                    apellido: userLastnameInput.value,
                    edad: userAgeInput.value,
                    alias: userAliasInput.value,
                    avatar: userAvatarInput.value
                },
                fecha: new Date(),
                // fecha: new Date().toLocaleString("en-GB"),
                mensaje: msgInput.value
            }
        ]
    } 
    return newMessage
}

async function sendNormalizedMessage() {
    const fields = [userIdInput, userInput, userLastnameInput, userAgeInput, userAliasInput, userAvatarInput, msgInput];
    let valideInputs = checkMsgInputs(fields);

    if(valideInputs){
        let newMessage = createMessage();
        // let newMessageStr = JSON.stringify(newMessage)
        // console.log('OriginalMsgStr', newMessageStr);
        console.log('OriginalMsg', newMessage);
        let [normMessage, denormMessage] = normalizeMessage(newMessage);
        console.log('normMsg', normMessage);
        console.log('denormMsg', denormMessage);
        // console.log('Normalized Again', normalizeMessage(denormMessage)[0] )
        let url = `${uri}/mensajes/normalized`;
        let verb = 'POST';
        let response = await fetch(url, { method: verb,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(normMessage)
        })
        let data = await response.json();
        !("error" in data) && ([msgInput.value] = ['']);
        // console.log(data);
        if (data?.error === "Usuario no autenticado"){
            console.log("Error", data);
            results.classList.add('errorLabel');
            results.innerHTML=`<h1>Error</h1>${JSON.stringify(data)}</p>`;
            setTimeout(() => {
                location.href=`${uri}/login`
            }, 2000);
        }else{
            socket.emit('normMessageRequest','msj')
        }
    }
}

async function logout(){

    let response = await fetch(`${uri}/login`, { method: 'DELETE',
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        }
    })
    let resp = await response.json();
    if (resp.user){
        let user = resp.user;
        console.log('LogoutUser', user);
        // document.body.innerHTML = `<h1>HASTA LUEGO ${user}</h1>`
        // alert("HASTA LUEGO "+ resp.user);
        location.href=`${uri}/logout/${user}`
    }else{
        location.href=`${uri}/login`
    }

}


//------USER------------------------
logoutButton.addEventListener('click', () => logout())
//------PRODUCTS FORM---------------------------
submitButton.addEventListener('click', () => submitForm())
getOneButton.addEventListener('click', () => getOneProduct(idInput.value))
updateButton.addEventListener('click', () => updateProduct(idInput.value))
deleteOneButton.addEventListener('click', () => deleteOneProduct(idInput.value))
getAllButton.addEventListener('click', getAllProducts)
getAllRandomButton.addEventListener('click', getAllRandomProducts)
//------CARTS FORM-----------------------------------

saveCartButton.addEventListener('click', () => saveCart(cartUserInput.value))
saveProdInCartButton.addEventListener('click', () => saveProdInCart(idCartInput.value))
getAllCartsButton.addEventListener('click', getAllCarts)
getCartButton.addEventListener('click', () => getOneCart(idCartInput.value))
deleteProductInCartButton.addEventListener('click', () => deleteOneProductInCart(idCartInput.value, idProdInput.value));
deleteCartButton.addEventListener('click', () => deleteOneCart(idCartInput.value))

//-------MESSAGES------------------------------------
sendNormMsgButton.addEventListener('click', () => sendNormalizedMessage())
sendMsgButton.addEventListener('click', () => sendMessage())