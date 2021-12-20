//Required Dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");
const app = express() ;
const fs = require('fs');
//var busboy = require('connect-busboy');
const fileUpload = require('express-fileupload');
//const multer = require('multer');
const mkdirp = require('mkdirp');
const cookieParser = require('cookie-parser')
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Required Models
const users = require('./models/users');
const products = require('./models/products');
const chats = require('./models/chats');
var activeUsers = {};


const url = '';

// Setting PAths
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, '/public')));
app.use(fileUpload());

// Variables
var count = 0;
var connected = 0;
let productsList;
let typesList = ['vehicle', 'stationary', 'electric appliance'];
var user = {
    _id: 'default',
    name: 'default',
    email: 'default',
    password: 'default',
    phone: 'default',
    cart: []
};
typesList.sort();


const port = 3000;//Port No

// Connection Code
mongoose
    .connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    }, { autoReconnect: true })
    .then(() => { console.log('Connected With Database'); connected = 1; })
    .catch((err) => {
        console.log('Not Connected With Database');
        count++;
        console.log('trying to connect' + count + 'times');

        console.log(err);
    });

    app.use(bodyParser.urlencoded({ extended: false }));
   // app.use(cookieParser());

    // parse application/json
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    }));  
    
    
    //function used
    function arrayRemove(arr, value) { 
    
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }

    

    app.get('/',(req,res) => {
        //var { isLogined = false } = req.cookies;
        //console.log(isLogined);
        //if(isLogined ){
        //res.redirect('/home');
        //}
        //else{
        console.log(req.cookies !== undefined ,req.cookies.isLogined === true,req.cookies);
        res.cookie('isLogined',false);
        res.render('index.ejs');
        //}
    });
    app.get('/logout',(req,res)=>{
        //res.clearCookie('userId');
        //res.clearCookie('isLogined');
        res.redirect('/');
    })

    app.post('/signup', (req, res) => {
        res.cookie('isLogined',false);
        var userBody = req.body;
        // console.log(req.body);
        if (userBody.sigpassword == userBody.cpassword) {
            var newUser = new users(
             { name: userBody.name, email: userBody.sigemail, password: userBody.sigpassword, phone: userBody.phoneNo }
            );
            newUser.save()
                .then(newUser => {
                     console.log(`${newUser} added`);
                })
                .catch(err => {
                    console.log(err);
                });
            res.redirect('/');
        }
        else {
            document.alert(`passwords do not match`);
        }
    });

    app.get('/login', async (req,res)=>{
        
        var userQuery = req.query;
        try{
            var user = await users.findOne({ email: userQuery.logemail, password: userQuery.logpassword }).exec();
        //console.log(user)
            if (user) {
                console.log('user is', user);
                res.cookie('isLogined',true);
                res.cookie('userId',user._id);
                console.log(req.cookies);
               res.redirect('/home');
            }
            else {
            res.sendStatus(204);
            }
        }
        catch(error){
            return console.log('error', error);
        }
    })
 
    
    app.get('/home',async (req,res)=>{

        var { isLogined = false } = req.cookies;
        // req.session.isLogined=false;
        // console.log(req.session.isLogined);
        if( isLogined !== 'true'){
            res.redirect('/');
        }
        else{
            productsList = await products.find({});
            var userId = req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
                var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'home.css'];

                var productsList = await products.find({}).exec();
                let keys = [];
                let lPrice = "";
                let hPrice = "";
                //console.log(user, typeof (productsList), productsList.length);
                res.render('home.ejs', { user, productsList, typesList, keys, lPrice, hPrice, cssFiles, cart:user.cart });
            }
            catch(error){
                console.log('error', error);
            }
        
        }
    })

    app.post('/home', async (req, res) => {
        var { isLogined = false } = req.cookies;
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'home.css'];
        var body = req.body;
        var keys = [], keys1 = [], lPrice = body.LowerPrice, hPrice = body.HigherPrice;
        for (var key in body) {
            if (key !== 'LowerPrice' && key !== 'HigherPrice') {
                keys.push(key);
            }
        }
        keys1 = keys;
        if (keys1.length == 0) {
            keys1 = typesList;
        }
    
        if (lPrice.length == 0 || hPrice.length == 0) {
            try {
                var productsList = await products.find({ "productType": { "$in": keys1 } }).exec();
                //console.log('first', keys1, productsList.length);
                res.render('home.ejs', { user, productsList, typesList, keys, lPrice, hPrice, cssFiles, cart:user.cart  });
            }
            catch (error) {
                console.log('error', error);
            }
        }
        else {
            try {
                var productsList = await products.find({ "price": { "$gte": parseInt(body.LowerPrice), "$lte": parseInt(body.HigherPrice) }, "productType": { "$in": keys1 } }).exec();
                //console.log('second', keys1, lPrice, hPrice, productsList.length);
                res.render('home.ejs', { user, productsList, typesList, keys, lPrice, hPrice ,cssFiles, cart:user.cart });
            }
            catch (error) {
                console.log('error', error);
            }
        }
        }
        catch(error){
            console.log(error);
        }
    }
    });

    app.get('/chats', async (req, res) => {
        var { isLogined = false } = req.cookies;
        if (isLogined !== 'true') {
            res.redirect('/');
        }
        else {
            var userId = req.cookies.userId;
            try {
                var user = await users.findById(userId).populate('chatList.receiverId').populate('chatList.chatId').exec();
                // console.log('user chatList ',user.chatList,'********');
                
                for(var i=0;i<user.chatList.length;i++){
                    console.log('length *********',user.chatList.length,user.chatList[i].chatId.p1,user.chatList[i].chatId.p2,user.chatList[i].chatId.time);
                }

                await user.chatList.sort(function(a,b){return new Date(b.chatId.time) - new Date(a.chatId.time)});
                
                for(var i=0;i<user.chatList.length;i++){
                    console.log('*********',user.chatList.length,user.chatList[i].chatId.p1,user.chatList[i].chatId.p2,user.chatList[i].chatId.time);
                }
                // console.log('user chatList ',user.chatList);
                var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'chats.css'];
        
                res.render('chats.ejs', { user, cssFiles  });
    
            } catch (error) {
                console.log('error', error);
            }
        }
    });
    
    
    app.post('/chatsData', async (req, res) => {
        
        
            var uId = req.body.uId;
            var rId = req.body.rId;
            try {
                // var chat="repnse for chat";
                var user = await users.findById(uId).exec();//populate('chatList.receiverId');
                var receiver = await users.findById(rId).exec();//populate('chatList.receiverId');
                var chatId = user.chatList.find(function (element) {
                    return (element.receiverId.toString() ===  rId)
                     
                });
                var chat = await chats.findById(chatId.chatId).exec();
                res.send(chat);
            } catch (error) {
                console.log('error', error);
            }
        
    });
    
    
    app.post('/chatListData', async (req, res) => {
        
        var uId = req.body.uId;
        try {
            var user = await users.findById(uId).exec();//populate('chatList.receiverId');
            res.send(user);
        } catch (error) {
            console.log('error', error);
        }
    
    });
    


    app.get('/myCart', async (req, res) => {
        var { isLogined = false } = req.cookies;
        // req.session.isLogined=false;
        // console.log(req.session.isLogined);
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'myCart.css'];
        try {
            var productsList = await products.find({ '_id': { '$in': user.cart } }).exec();
            let keys = [];
            let lPrice = "";
            let hPrice = "";
            // console.log('mycart *******',user[0],typeof(productsList), productsList.length ,productsList);
            // console.log('myCart', user);
            console.log('myCart', user.cart.length);
            res.render('myCart.ejs', { user, productsList, typesList, keys, lPrice, hPrice, cssFiles });
        }
        catch (error) {
            console.log('error', error);
        }
    }
    catch(error){console.log(error);}}
    });

    app.post('/myCart', async (req, res) => {
        var { isLogined = false } = req.cookies;
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'home.css'];
        var body = req.body;
        var keys = [], keys1 = [], lPrice = body.LowerPrice, hPrice = body.HigherPrice;
        for (var key in body) {
            if (key !== 'LowerPrice' && key !== 'HigherPrice') {
                keys.push(key);
            }
        }
        keys1 = keys;
        if (keys1.length == 0) {
            keys1 = typesList;
        }
    
        if (lPrice.length == 0 || hPrice.length == 0) {
            try {
                var productsList = await products.find({ "productType": { "$in": keys1 },'_id': { '$in': user.cart } }).exec();
                console.log('first', keys1, productsList.length,user.cart);
                res.render('myCart.ejs', { user, productsList, typesList, keys, lPrice, hPrice, cssFiles });
            }
            catch (error) {
                console.log('error', error);
            }
        }
        else {
            try {
                var productsList = await products.find({ "price": { "$gte": parseInt(body.LowerPrice), "$lte": parseInt(body.HigherPrice) }, "productType": { "$in": keys1 },'_id': { '$in': user.cart } }).exec();
                //console.log('second', keys1, lPrice, hPrice, productsList.length);
                res.render('myCart.ejs', { user, productsList, typesList, keys, lPrice, hPrice, cssFiles });
            }
            catch (error) {
                console.log('error', error);
            }
        }
        }
        catch(error){
            console.log(error);
        }
    }
    });


    app.get('/profile', async (req, res) => {
        var { isLogined = false } = req.cookies;
        // req.session.isLogined=false;
        // console.log(req.session.isLogined);
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'profile.css'];
        try {
            var productsList = await products.find({ authorId: user._Id });
            let keys = [];
            let lPrice = "";
            let hPrice = "";
            console.log(user, typeof (productsList), productsList.length);
            res.render('profile.ejs', { user, productsList, typesList, keys, lPrice, hPrice,cssFiles  });
    
        }
        catch (error) {
            console.log('error', error);
        }
    }
    catch(error){console.log(error);}}
    });
    
    
    app.post('/updateUserProfile', async (req, res) => {
        var { isLogined = false } = req.cookies;
        // req.session.isLogined=false;
        // console.log(req.session.isLogined);
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        console.log('after getting user', typeof (req.file), typeof(req.files), req.files);
        if(req.files == null){
            
        var cpname = "";
        var dpname = "";
        }else {
        var dp = req.files.displayPic;
        var cp = req.files.coverPic;
        var cpname = typeof(cp) !== 'undefined' ? cp.name : "";
        var dpname = typeof(dp) !== 'undefined' ? dp.name : "";
        console.log(typeof dp);
        console.log(dp);
        console.log(typeof cp);
        console.log(cp);
    }
    
    
        try {
            var oldcp=user.coverPic;
            var olddp=user.displayPic;
            user.name = req.body.name;
            user.email = req.body.email,
            user.phone = req.body.phone;
            user.college = req.body.college;
            user.branch = req.body.branch;
            user.bio = req.body.bio;
            if (dpname != "") {
                user.displayPic = dpname;
            }
            if (cpname != "") {
                user.coverPic = cpname;
            }
            console.log('dp cp', olddp, oldcp, dpname , cpname, 'user to be saved', user);
    
            await user.save()
                .then(user => {
                    console.log(`${user} updated`);
    
                    fs.mkdirSync(`public/user_images/${user._id}/coverPic`
                    ,{ recursive: true }
                    // , (err) => {
                    //         if (err) {
                    //             return console.error(err);
                    //         }
                    //         console.log('cp Directory created successfully!');
                    //     }
                        );
    
                    if (cpname != "") {
    
                        // if (imageFile != "") {
                            if (oldcp != "") {
                                fs.unlinkSync('public/user_images/' + user._id + '/coverPic/' + oldcp
                                // , function (err) {
                                //     if (err)
                                //         console.log(err);
                                // }
                                );
                            }
                            var path = 'public/user_images/' + user._id + '/coverPic/' + cp.name;
                        cp.mv(path, function (err) {
                            return console.log(err);
                        });
                        console.log('cp moved');
                    }
    
                    fs.mkdirSync(`public/user_images/${user._id}/displayPic`
                        ,{ recursive: true }
                        // , (err) => {
                        //     if (err) {
                        //         return console.error(err);
                        //     }
                        //     console.log('dp Directory created successfully!');
                        // }
                        );
                    console.log('dp Directory created successfully!');
                        
                    if (dpname != "") {
    
                        if (olddp != "") {
                            fs.unlinkSync('public/user_images/' + user._id + '/displayPic/' + olddp
                            // , function (err) {
                            //     if (err)
                            //         console.log(err);
                            // }
                            );
                        }
                        var path = 'public/user_images/' + user._id + '/displayPic/' + dp.name;
                        dp.mv(path, function (err) {
                            return console.log(err);
                        });
                        console.log('dp moved');
                    }
                    console.log('going to redirect');
                    res.redirect(`/profile`);
                })
                .catch(err => {
                    console.log(err);
                });;
    
        }
        catch (error) {
            console.log(error);
        }}
        catch(error){console.log(error);}}
    
    });
    

    app.get('/sellItem', async (req, res) => {
        var { isLogined = false } = req.cookies;
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'sellItem.css'];
        res.render('sellItem.ejs', { user, typesList, cssFiles });
            }
            catch(error){console.log(error);}}
    });
    
    
    app.get('/addToCart/:pid', async (req, res) => {
        var { isLogined = false } = req.cookies;
    // req.session.isLogined=false;
    // console.log(req.session.isLogined);
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
        var { pid } = req.params;
        try {
        // await users.findOneAndUpdate({user_id : user._id},{ $push : {cart: pid}}).exec();
            await user.cart.push(pid);
            user.save()
                .then(user => {
                     console.log(`${user} updated`);

                    res.redirect(`/home`);
                })
                .catch(err => {
                    console.log(err);
                });;
        
            console.log('added', user.cart.length);
        // res.redirect(`/product/${pid}`);
    }
    catch (error) {
        console.log('error', error);
    }
}catch(error){console.log(error);}}
    });
  
    app.get('/removeCart/:pid',async (req,res) =>{
        var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var { pid } = req.params;
    try {
        await user.cart.pull(pid);
        user.save()
            .then(user => {
                console.log(`${user} updated`);

                res.redirect(`/home`);
            })
            .catch(err => {
                console.log(err);
            });;
    }
    catch (error) {
        console.log('error', error);
    }}
    catch(error){console.log(error);}}
    })
    app.post('/removeCart/:pid',async (req,res) =>{
        var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var { pid } = req.params;
    try {
        await user.cart.pull(pid);
        user.save()
            .then(user => {
                console.log(`${user} updated`);

                res.redirect(`/home`);
            })
            .catch(err => {
                console.log(err);
            });;
    }
    catch (error) {
        console.log('error', error);
    }}
    catch(error){console.log(error);}}
    })

    app.get('/myCart/removeCart/:pid',async (req,res) =>{
        var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var { pid } = req.params;
    try {
        await user.cart.pull(pid);
        user.save()
            .then(user => {
                console.log(`${user} updated`);

                res.redirect(`/myCart`);
            })
            .catch(err => {
                console.log(err);
            });;
    }
    catch (error) {
        console.log('error', error);
    }}
    catch(error){console.log(error);}}
    })

    app.post('/posting', async (req, res) => {
        var { isLogined = false } = req.cookies;
        if( isLogined !== 'true'){
            res.redirect('/');
            
        }
        else{
            var userId=req.cookies.userId;
            try{
                var user= await users.findById(userId).exec();
            
        var pImage = req.files.productImage;
        console.log(typeof pImage);
        console.log(pImage);
    
        // console.log(pImage.length);
        imgNames = [];
        if (pImage.length == undefined) {
            pImage = [pImage];
        }
        pImage.forEach(function (pimage) {
            imgNames.push(pimage.name);
        });
        var product = new products({
            authorId: user._id,
            authorName: user.name,
            authorEmail: req.body.authorEmail,
            authorPhone: req.body.authorPhoneNo,
            productType: req.body.typeList,
            image: imgNames,
            price: req.body.productPrice,
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            isAvailable: true
        });
    
        // prodect.save();
        product.save(function (err) {
            if (err)
                return console.log(err);
            console.log(product);
    
            fs.mkdir(`public/product_images/${product._id}`,
                { recursive: true }, (err) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Directory created successfully!');
                });
    
            pImage.forEach(function (pimage) {
                var imageFile = pimage.name;
                if (imageFile != "") {
                    var path = 'public/product_images/' + product._id + '/' + imageFile;
                    pimage.mv(path, function (err) {
                        return console.log(err);
                    });
                }
            });
            res.redirect('/home');
    
        });
    
    }
    catch(error){console.log(error);}}
    });


    io.on('connection', client => {
        client.on('event', data => { console.log("socket connection"); });
        client.on('connectUser', async data => {
            console.log('connectUser data', data);
            var userId = data.userId;
        try {
            var user = await users.findById(userId).exec();
            user.socketId = client.id; 
            try {
                 user.save()
                    .then(user => {
                        console.log(`user updated`);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
            catch (error) {
                console.log('error', error);
            }
        }
        catch (error) { console.log(error); }
        });
    
        client.on('send', async data => {
            console.log('send data', data);
            //save msg to db
            try {
                var newChat = false;
                var sender = await users.findOne( {email : data.from}).exec();
                console.log('sender',sender                          )
                var receiver = await users.findOne({ email: data.to.trim() }).exec();
                console.log('reciever',receiver                )
                var conversation = await chats.findOne({$or : [{ p1 : data.from , p2 : data.to },{ p1 : data.to , p2 : data.from }]}).exec();
                if(!conversation){
                    
                    var newConversation = new chats(
                        { p1: data.from , p2: data.to , time :  new Date().getTime()}
                    );
                    console.log('new chat');
                    conversation=newConversation;
                    try{
                         await newConversation.save();
                        // .then(newConversation => {
                            conversation=newConversation;
                            newChat= true;
                            sender.chatList.push({receiverEmail : receiver.email, receiverId : receiver._id, chatId : conversation._id});
                            sender.save()
                            .then(sender => {
                                console.log('sender updated');
                            })
                            .catch(err => {
                                console.log(err);
                            });
    
                            receiver.chatList.push({receiverEmail : sender.email, receiverId : sender._id, chatId : conversation._id});
                            receiver.save()
                            .then(receiver => {
                                console.log('receiver updated');
                            })
                            .catch(err => {
                                console.log(err);
                            });
                        // })
                        // .catch(err => {
                            // console.log(err);
                        // });
                    }catch(err){
                        console.log(err);
                        
                    }
                }
                if ( conversation) {
                    conversation.chat.push({sender: data.from , msg : data.msg , time : data.time});
                    conversation.time=data.time;
                    conversation.save()
                        .then(conversation => {
                            console.log(`${conversation} updated`);
                            console.log(data.time);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                        
                    try {
                        var receiver = await users.findOne({ email: data.to.trim() }).exec();
                        console.log(receiver,data.to)
                        if (receiver.socketId) {
                            console.log('sender socket', client.id , 'receiver socket', receiver.socketId);
                        client.to(receiver.socketId).emit('receive', {from : sender.email , msg : data.msg, fromId : sender._id, newChat : newChat , sender : sender});
                        if(data.info){
                            client.emit('sent');
                        }
                        }
                    }
                    catch (error) {
                        return console.log('error', error);
                
                    };
                    // res.redirect('/home');
                }
                else {
                    client.emit('error sending message');
                    // res.send('login failed');
                }
            }
            catch (error) {
                return console.log('error', error);
        
            };
            // activeUsers[data.email] = client.id;
            // console.log(activeUsers);
        });
    
        client.on('hello', () => {
            client.emit('good', { key: 'value', key1: 'bvalue1' });
            // console.log("socket reply",client);
        });
    
        client.on('disconnect', () => { 
            console.log("socket disconnected");
            
        });
    });
    

    server.listen(port, () => {
        console.log(`listening on port ${port}`);
    });

