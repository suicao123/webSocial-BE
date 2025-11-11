const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function authUser(username, password) {
    try {
        const user = await prisma.users.findUnique({
            where: {
                username: username
            }
        });

        if(!user) {
            return null;
        }

        // const isMatchPass = await bcrypt.compare(password, user.password_hash);
        const isMatchPass = password == user.password_hash;

        if(!isMatchPass) {
            return null;
        }

        return user;
    }
    catch (error) {
        return null;
    }

}

module.exports = {
    authUser
}
