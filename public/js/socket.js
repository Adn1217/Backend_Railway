const socket = io();

function tableRender(prods){
    let htmlTableRows = '';
    // console.log('Productos', prods);
    !(prods.id) ? prods.forEach((element) => {
        htmlTableRows += `<tr>
                    <td>${element.id || element._id}</td>
                    <td>${element.code}</td>
                    <td>${element.title}</td>
                    <td>${element.description}</td>
                    <td>$${element.price}</td>
                    <td>${element.stock}</td>
                    <td><img src="${element.thumbnail}" alt="Imagen de producto ${element.id}"></td>
                    </tr>`
    }) : (
        htmlTableRows += `<tr>
                    <td>${prods.id || prods._id.substring(18,24)}</td>
                    <td>${prods.code}</td>
                    <td>${prods.title}</td>
                    <td>${prods.description}</td>
                    <td>$${prods.price}</td>
                    <td>${prods.stock}</td>
                    <td><img src="${prods.thumbnail}" alt="Imagen de producto ${prods.id}"></td>
                    </tr>`)

    htmlTableHeaders = `<th>Id</th>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Imagen</th>`

    let htmlTable = `
        <table class="table">
            <thead>
                ${htmlTableHeaders}
            </thead>
            <tbody>
                ${htmlTableRows}
            </tbody>
        </table>`
    return htmlTable;
}

function denormalizeMessage(normalizedMessages){
    const schema = window.normalizr.schema;
    const denormalize = window.normalizr.denormalize;
    
    const authorSchema = new schema.Entity('authorSchema');
    const msjSchema = new schema.Entity('msjSchema',{
        author: authorSchema
    }, {idAttribute: 'id'})
    const msgSchema = new schema.Entity('msgSchema',{
        messages: [msjSchema]
    })
    const messageSchema = new schema.Entity('messageSchema',{
        msj: msgSchema
    }, {idAttribute: 'id'})
    const msgsSchema = new schema.Entity('msgsSchema',{
        messages: [messageSchema]
    }, {idAttribute: 'type'} );

    const denormalizedMessages = denormalize(normalizedMessages.result, msgsSchema, normalizedMessages.entities);
    return denormalizedMessages;
}

function chatRender(msgs, compression = null){
    let htmlChat = '';
    (msgs[0].msj) && (htmlChat+= `<h4>Mensajes normalizados (Compresión: ${compression}%)</h4>`);
    const userInputFields = [userIdInput, userInput, userLastnameInput, userAgeInput, userAliasInput, userAvatarInput];
    userInputFields.forEach ((field) => {
        field.setAttribute('disabled', '');
    })
    
    msgs.forEach((msg) => {
        let date = Date.parse(msg?.fecha) ||  Date.parse(msg?.msj[0].fecha)
        let formattedDate = (new Date(date)).toLocaleDateString('en-GB') + ', ' + (new Date(date)).toLocaleTimeString('en-GB') || msg.fecha;
        let fecha = formattedDate || date;
        let user = msg?.usuario || msg.msj[0].author?.nombre || 'Sin autor';
        htmlChat += `<div id="msj" class="rounded-3">
                        <p><strong>${user}:</strong><br>${msg.mensaje || msg.msj[0].mensaje}<br><em>Recibido el ${fecha}</em></p>
                    </div>`
    })
    return htmlChat;
}

socket.on('welcome', data => {
    // console.log(data)
    socket.emit('productRequest','msj')
})

socket.on('productos', prods => {
    console.log('Productos: ', prods?.productos || prods);
    if (!("error" in prods)){
        results.innerHTML= tableRender(prods?.productos || prods);
    }
})

socket.on('mensajes', msgs => {
    // console.log(msgs)
    let mensajes = msgs.msgs;
    let normSize = JSON.stringify(mensajes).length;
    let compression = 0;
    console.log('mensajes: ', mensajes);
    if (mensajes.entities){ // Si viene normalizado
        mensajes = denormalizeMessage(mensajes);
        let denormSize = JSON.stringify(mensajes).length;
        compression = parseFloat(((denormSize-normSize)/denormSize)*100).toFixed(2);
        mensajes = mensajes.messages;
        mensajes.sort((a,b) => {
            let date1 = new Date(a.msj[0].fecha);
            let date2 = new Date(b.msj[0].fecha);
            return date2.getTime() - date1.getTime();
        })
        console.log('mensajes desnormalizados: ', mensajes);
        console.log('Porcentaje de compresión: ', compression);
    }else{
        mensajes.sort((a,b) => {
            let date1 = new Date(a.fecha);
            let date2 = new Date(b.fecha);
            return date2.getTime() - date1.getTime();
        })
    }
    if (!("error" in msgs)){
        chat.innerHTML= chatRender(mensajes, compression);
    }
})
