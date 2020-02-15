/**
 * CONTROLLER UNIT TESTS
 */
const app = require('../server')
const supertest = require('supertest')
const rewire = require('rewire')
const request = supertest(app)
const db = require('../common/db')

const usersController = rewire('../controllers/users')
hasPermission = usersController.__get__('hasPermission')


var token

const testUsername = "testUser"
const testPassword = "update"


beforeAll(async (done) => {
    // create a user
    var res = await request.post('/users/login/basic')
        .send({ email: "admin", password: "123" })

    token = res.body.token

    done()

    // make sure that there isn't a testUser in the DB

})

afterAll(async (done) => {
    console.log("Removing test user...")
    // create a user
    db.get().query(`DELETE FROM users WHERE email='${testUsername}'`, (error, result, fields) => {
        if (error) {
            console.log(error)
            return
        }
        done()
    })
})

describe('/users routes are authenticated', () => {
    it('/all', async done => {
        const res = await request.get('/users/all')
        expect(res.status).toBe(401)
        done()
    })

    it('/verify', async done => {
        const res = await request.post('/users/verify')
        expect(res.status).toBe(401)
        done()
    })

    it('/login/ldap', async done => {
        const res = await request.post('/users/verify')
        expect(res.status).toBe(401)
        done()
    })
})


describe('GET /all', () => {

})

describe('POST /create', () => {
    it('empty body -> 400', async done => {
        const res = await request.post('/users/create')
            .send({})
        expect(res.status).toBe(400)
        done()
    })

    it('missing email -> 400', async done => {
        const res = await request.post('/users/create')
            .send({ password: testPassword, register_pin: '123' })
        expect(res.status).toBe(400)
        done()
    })

    it('missing password -> 400', async done => {
        const res = await request.post('/users/create')
            .send({ email: testUsername, register_pin: '123' })
        expect(res.status).toBe(400)
        done()
    })

    it('missing pin -> 400', async done => {
        const res = await request.post('/users/create')
            .send({ email: testUsername, password: testPassword })
        expect(res.status).toBe(400)
        done()
    })

    it('incorrect pin -> 401', async done => {
        const res = await request.post('/users/create')
            .send({ email: testUsername, password: testPassword, register_pin: 'wrongpin' })
        expect(res.status).toBe(401)
        done()
    })

    it('creates a user -> 201', async done => {
        const res = await request.post('/users/create')
            .send({ email: testUsername, password: testPassword, register_pin: '123' })
        expect(res.status).toBe(201)
        done()
    })

    it('creates dup user -> 409', async done => {
        const res = await request.post('/users/create')
            .send({ email: testUsername, password: testPassword, register_pin: '123' })
        expect(res.status).toBe(409)
        done()
    })
})

describe('POST /login/basic', () => {
    it('empty body -> 400', async done => {
        const res = await request.post('/users/login/basic')
            .send({})
        expect(res.status).toBe(400)
        done()
    })

    it('missing email -> 400', async done => {
        const res = await request.post('/users/login/basic')
            .send({ password: testPassword })
        expect(res.status).toBe(400)
        done()
    })

    it('missing password -> 400', async done => {
        const res = await request.post('/users/login/basic')
            .send({ email: testUsername })
        expect(res.status).toBe(400)
        done()
    })

    it('missing password -> 400', async done => {
        const res = await request.post('/users/login/basic')
            .send({ email: testUsername })
        expect(res.status).toBe(400)
        done()
    })

    it('incorrect password -> 401', async done => {
        const res = await request.post('/users/login/basic')
            .send({ email: testUsername, password: 'wrongpassword' })
        expect(res.status).toBe(401)
        done()
    })

    it('correct login -> 200', async done => {
        const res = await request.post('/users/login/basic')
            .send({ email: testUsername, password: testPassword })
        expect(res.status).toBe(200)
        done()
    })
})

describe('POST /verify', () => {
    it('empty body -> 400', async done => {
        const res = await request.post('/users/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({})
        expect(res.status).toBe(400)
        done()
    })

    it('missing password -> 400', async done => {
        const res = await request.post('/users/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({})
        expect(res.status).toBe(400)
        done()
    })

    it('wrong password -> 400', async done => {
        const res = await request.post('/users/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 123 })
        expect(res.status).toBe(500)
        done()
    })

    it('correct verification -> 400', async done => {
        const res = await request.post('/users/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: testPassword })
        expect(res.status).toBe(200)
        done()
    })
})

describe('Helper: hasPermissions', () => {
    it('testField: 1 -> true', () => {
        expect(hasPermission({ testField: 1 }, "testField")).toBe(true)
    })

    it('testField: 0 -> false', () => {
        expect(hasPermission({ testField: 0 }, "testField")).toBe(false)
    })

    it('testField: true -> true', () => {
        expect(hasPermission({ testField: true }, "testField")).toBe(true)
    })

    it('testField: false -> false', () => {
        expect(hasPermission({ testField: false }, "testField")).toBe(false)
    })

    it('Wrong field check', () => {
        expect(hasPermission({ testField: false }, "test")).toBe(false)
    })
})