const User = require('../models/User')

const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")

// helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')

module.exports = class UserController {
    static async register(req, res) {

        const { name, email, phone, password, confirmpassword } = req.body

        // validations
        if (!name) {
            res.status(422).json({ message: 'O nome é obrigatorio'})
            return  
         }

         if (!email) {
            res.status(422).json({ message: 'O email é obrigatorio'})
            return  
         }

         if (!phone) {
            res.status(422).json({ message: 'O telefoneé obrigatorio'})
            return  
         }

         if (!password) {
            res.status(422).json({ message: 'A senha é obrigatorio'})
            return  
         }

         if (!confirmpassword) {
            res.status(422).json({ message: 'A confirmação de senha  é obrigatorio'})
            return  
         }

         if(password !== confirmpassword) {
            res.status(422).json({ message: 'A senha e a confirmação de senha precisam ser igais ',
            })
            return  
         }


         // chesk if user exists
         const userExists = await User.findOne({email: email})

         if(userExists) {
            res.status(422).json({ message: 'Por favor, utilize outro e-mail ',
            })
            return  
         }

         // create a password
         const salt = await bcrypt.genSalt(12)
         const passwordHash = await bcrypt.hash(password, salt)

         // create a user 
         const user = new User({
            name,
            email,
            phone,
            password: passwordHash,
         })

         try {
            const newUser = await user.save()  
         
            await createUserToken(newUser, req, res)
         } catch (error) {
            res.status(500).json({message: error})
         }
       }

       static async login(req, res) {
         const {email, password} = req.body

         if (!email) {
            res.status(422).json({ message: 'O e-mail é obrigatório' })
            return
         }

         if (!password) {
            res.status(422).json({ message: 'A senha é obrigatório' })
            return
         }
         
         // chesk if user exists
          const user = await User.findOne({email: email})

            if(!user) {
               res.status(422).json({ message: 'Não há usuário cadastrado com este e-mail! ',
               })
               return  
            }

            // check ifpassword match with db password 
            const checkPassword = await bcrypt.compare(password, user.password)

            if(!checkPassword) {
                  res.status(422).json({ 
                     message: 'Senha inválida! ',
                  })
                  return 
            }

            await createUserToken(user, req, res)
       }

       static async checkUser(req, res) {
         let currentUser


         if(req.headers.authorization) {

            const  token = getToken(req)
            const decoded = jwt.verify(token, 'nossosecret')

            currentUser = await User.findById(decoded.id)

            currentUser.password = undefined
         } else {
            currentUser = null
         }

         res.status(200).send(currentUser)
       }
     }
   