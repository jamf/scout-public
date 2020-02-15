const app = require('../server')
const supertest = require('supertest')
const request = supertest(app)
const db = require('../common/db')
var token

beforeAll(async (done) => {
    var res = await request.post('/users/login/basic')
        .send({ email: "admin", password: "123" })

    token = res.body.token

    done()
})

describe('/servers is authenticated', () => {
    it('POST /servers/add', async done => {
        const res = await request.post('/servers/add')
        expect(res.status).toBe(401)
        done()
    })
    it('POST /servers/access', async done => {
        const res = await request.get('/servers/access')
        expect(res.status).toBe(401)
        done()
    })
    it('PUT /servers/update/:id', async done => {
        const res = await request.put('/servers/update/1')
        expect(res.status).toBe(401)
        done()
    })
    it('DELETE /servers/delete/devices/:serverid', async done => {
        const res = await request.delete('/servers/delete/devices/4')
        expect(res.status).toBe(401)
        done()
    })
    it('DELETE /servers/delete/:id', async done => {
        const res = await request.delete('/servers/delete/1')
        expect(res.status).toBe(401)
        done()
    })
    it('GET /servers/', async done => {
        const res = await request.get('/servers/')
        expect(res.status).toBe(401)
        done()
    })
})

describe('/servers/add', () => {
    it('empty Body', async done => {
        const res = await request.post('/servers/add').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(400)
        done()
    })

    it('missing url', async done => {
        const res = await request.post('/servers/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'test', password: 'test', cronLimited: '* * * * *', cronExpanded: '* * * * *' })
        expect(res.status).toBe(400)
        done()
    })

    it('missing password', async done => {
        const res = await request.post('/servers/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'test', username: 'test', cronLimited: '* * * * *', cronExpanded: '* * * * *' })
        expect(res.status).toBe(400)
        done()
    })

    it('missing cronLimited', async done => {
        const res = await request.post('/servers/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'test', username: 'test', password: 'test', cronExpanded: '* * * * *' })
        expect(res.status).toBe(400)
        done()
    })

    it('missing cronExpanded', async done => {
        const res = await request.post('/servers/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'test', username: 'test', password: 'test', cronLimited: '* * * * *' })
        expect(res.status).toBe(400)
        done()
    })

    it('check user permission', async done => {
        const res = await request.post('/servers/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'https://yvlbawi.pub.jamf.build', username: 'admin', password: 'jamf1234', cronLimited: '* * * * *', cronExpanded: '* * * * *' })

        expect(res.status).toBe(206)
        done()
    })
})

describe('/servers/', () => {
    it('returns server list', async done => {
        var res = await request.get('/servers')
            .set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.servers)).toBe(true)
        done()
    })
})
