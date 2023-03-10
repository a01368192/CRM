const { render } = require('ejs');
const express = require('express');
const router = express.Router();
let User = require("../model/user")
let Doctor = require("../model/doctor")
let Paciente = require("../model/paciente")
let Proveedor = require("../model/proveedor")

let verify = require("../middleware/acceso")

let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");

let NombreAtributos = [{title:"Doctores"},{title:"Pacientes"},{title:"Proveedores"}];

let AtributosDoctores = [{atributo:"Nombre"}, 
                         {atributo:"Email"},
                         {atributo:"Cédula"}, 
                         {atributo:"Especialidad"}, 
                         {atributo:"Cantidad pacientes"}, 
                         {atributo:"Facturas mensuales"},
                         {atributo:"Tipo"}];

let doctores = null

let AtributosPacientes = [{atributo:"Nombre"}, 
                         {atributo:"Apellido"},
                         {atributo:"Email"}, 
                         {atributo:"Sexo"}, 
                         {atributo:"Edad"}, 
                         {atributo:"Foto"},
                         {atributo:"Tipo"}];

let pacientes = null

let AtributosProveedores = [{atributo:"Nombre"}, 
                {atributo:"Email"},
                {atributo:"Cédula"}, 
                {atributo:"Especialidad"}, 
                {atributo:"Cantidad pacientes"}, 
                {atributo:"Facturas mensuales"},
                {atributo:"Tipo"}];

let proveedores = null

//Function to get all dcotors
async function getDoctors () {
    doctores = await Doctor.find();
}

//Function to get all patients
async function getPatients () {
    pacientes = await Paciente.find();
}

//Function to get all providers
async function getProviders () {
    proveedores = await Proveedor.find();
}

router.get("/admin", verify, async function(req,res){
    getDoctors()
    getPatients()
    getProviders()
    let doctor = await Doctor.find({usuario: req.userId})
    let paciente = await Paciente.find({usuario: req.userId})
    let proveedor = await Proveedor.find({usuario: req.userId})
    res.render("admin",{doctor, paciente, proveedor, AtributosDoctores, AtributosPacientes, AtributosProveedores, NombreAtributos})
})

router.get("/", function(req,res){
    res.render("index",{NombreAtributos, AtributosDoctores, doctores, title: 'Inicio' })
})

router.get("/login", function(req,res){

    res.render("index")
})

router.get("/signup", function(req,res){

    res.render("index")
})

router.get("/registroDoctor", function(req,res){

    res.render("registroDoctor")
})

router.post("/registroDoctor", verify, async function(req,res){

    let doctor = new Doctor(req.body)
    doctor.usuario = req.userId
    await doctor.save()
    res.redirect("/admin")
})

router.get("/registroPaciente", function(req,res){

    res.render("registroPaciente")
})

router.post("/registroPaciente", verify, async function(req,res){

    let paciente = new Paciente(req.body)
    paciente.usuario = req.userId
    await paciente.save()
    res.redirect("/admin")
})

router.get("/registroProveedor", function(req,res){

    res.render("registroProveedor")
})

router.post("/registroProveedor", verify, async function(req,res){

    let proveedor = new Proveedor(req.body)
    proveedor.usuario = req.userId
    await proveedor.save()
    res.redirect("/admin")
})

router.post("/signup", async function(req, res){

    //Objeto con string de correo + contraseña
    let user = new User(req.body)
    //Consulta a BD
    let exists = await User.findOne({email:user.email})
    //Si no hay usuarios con el mismo correo, se crea usuario
    if(!exists){

        //Métrica de seguridad del Hash (10). Seguridad y Complejidad
        user.password = bcrypt.hashSync(user.password,10)
        console.log(user.password)
        await user.save()
        res.redirect("/login")
    }else{
        res.redirect("/login")
    }
})

router.get("/newdoctor", async function(req, res){
    //Save new doctor
    let doctor = await Doctor.find()
    res.render('registroDoctor')
})

router.get("/newpaciente", async function(req, res){
    //Save new patient
    let paciente = await Paciente.find()
    res.render('registroPaciente')
})

router.get("/newproveedor", async function(req, res){
    //Save new doctor
    let proveedor = await Proveedor.find()
    res.render("registroProveedor")
})
router.post("/login", async function(req, res){
    let auth = false
    let email = req.body.email
    let plainpassword = req.body.password

    let user = await User.findOne({email:email})

    if(!user){
        res.redirect("/signup")
        auth = false
    }else{
        //El usuario existe, validar contraseña
        let valid = await bcrypt.compareSync(plainpassword,user.password)
        auth = true
        //Generar TOKEN y mandar a HOME
        if(valid && auth === true){
            //Recibe información a guardar(USERID) + Texto de Firma de TOKEN para que sea único
            // + Tiempo de expiración
            let token = jwt.sign({id: user.email}, process.env.SECRETO,{
                expiresIn:"10min"
            })
            console.log(token)
            //Guarda temporalmente el TOKEN en un espacio seguro del navegador
            res.cookie("token",token,{httpOnly:true})
            res.redirect("/admin")
        }else{
            res.redirect("/")
        } 
    }

     
})

//Editar Doctor
router.get('/edit/:id', async function(req,res){

    let id = req.params.id
    let doctor = await Doctor.findById(id)
    res.render("editregistroDoctor",{doctor})   
  })
  
//Editar Paciente
router.get('/editpa/:id', async function(req,res){

    let id = req.params.id
    let paciente = await Paciente.findById(id)
    res.render("editregistroPaciente",{paciente})   
  })

//Editar Proveedor
router.get('/editpr/:id', async function(req,res){

    let id = req.params.id
    let proveedor = await Proveedor.findById(id)
    res.render("editregistroProveedor",{proveedor})   
  })

router.post('/edit/:id', async function(req,res){
  
    let id = req.params.id
    await Doctor.updateOne({_id: id}, req.body)
    res.redirect("/admin")
})

router.post('/editpa/:id', async function(req,res){
  
    let id = req.params.id
    await Paciente.updateOne({_id: id}, req.body)
    res.redirect("/admin")
})

router.post('/editpr/:id', async function(req,res){
  
    let id = req.params.id
    await Proveedor.updateOne({_id: id}, req.body)
    res.redirect("/admin")
})

// Eliminar el elemento
router.get("/delete/:id", async function(req,res){

    let id = req.params.id
    await Doctor.remove({_id:id})
    res.redirect("/admin")
})

// Eliminar el elemento
router.get("/deletepa/:id", async function(req,res){

    let id = req.params.id
    await Paciente.remove({_id:id})
    res.redirect("/admin")
})

// Eliminar el elemento
router.get("/deletepr/:id", async function(req,res){

    let id = req.params.id
    await Proveedor.remove({_id:id})
    res.redirect("/admin")
})

router.get("/logout", function(req,res){
    //Borrar cookie para salir de la sesión
    res.clearCookie("token")
    res.redirect("/")
})

module.exports = router;