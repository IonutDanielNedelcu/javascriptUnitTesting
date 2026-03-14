const jwt = require("jsonwebtoken");

const db = require('../models');

const { JWT_SECRET_KEY } = require('../constants');

const jwtMiddleware = async (request, response, next) => {
    const authorizationHeader = request.headers.authorization;

    if(!authorizationHeader) {
        next();
        return;
    }

    const token = authorizationHeader.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, JWT_SECRET_KEY);
        const subjectId = payload.sub;

        // If token contains roles, avoid DB lookup and trust token claims
        if (payload.roles && Array.isArray(payload.roles)) {
            request.userData = {
                userID: subjectId,
                roles: payload.roles.map(r => ({ name: r })),
            };
        } else {
            // fallback to DB lookup (includes roles)
            const user = await db.User.findByPk(subjectId, {
                include: [
                    { model: db.Role, as: 'roles' },
                    { model: db.Team, as: 'team' },
                    { model: db.Position, as: 'position' },
                ],
            });

            if (!user) {
                console.error("No user found for the given token!");
                next();
                return;
            }

            request.userData = user;
        }

    } catch(e) {
        console.log("Invalid token encountered");
    }

    next();
}


module.exports = jwtMiddleware;
