const mysql = require('mysql2/promise');

async function seed() {
    try {
        const c = await mysql.createConnection({user:'root', database:'parts_db'});
        await c.query("INSERT INTO brand (name) VALUES ('Xiaomi'), ('Ninebot'), ('Apollo')");
        await c.query("INSERT INTO escooter (id_brand, model, description) VALUES (1, 'M365 Pro', 'Classic Xiaomi Scooter'), (2, 'Max G30', 'Long Range'), (3, 'Phantom', 'Performance')");
        console.log("Seeded Brands and Models");
        c.end();
    } catch(e) {
        console.error(e.message);
    }
}
seed();
