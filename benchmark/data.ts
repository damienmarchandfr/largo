import { ObjectID } from 'mongodb'
import { name, lorem, random, company, date, address } from 'faker'

function getHobbyName() {
	const hobbies = ['Tennis', 'Dev', 'Mountain bike', 'Skate']
	return hobbies[Math.floor(Math.random() * hobbies.length)]
}

export class User {
	_id?: ObjectID
	firstname: string
	lastname: string
	jobs: ObjectID[]
	hobbies: ObjectID[]

	constructor() {
		this.firstname = name.firstName()
		this.lastname = name.lastName()
		this.hobbies = []
		this.jobs = []
	}
}

export class Job {
	_id?: ObjectID
	name: string
	years: number
	description: string
	companyName: string
	numberOfEmployes: number
	employes: ObjectID[]

	constructor() {
		this.name = lorem.word()
		this.years = random.number({
			min: 1,
			max: 10,
		})
		this.description = lorem.paragraphs(2)
		this.companyName = company.companyName()
		this.numberOfEmployes = random.number({
			min: 50,
			max: 10000,
			precision: 1,
		})
		this.employes = []
	}
}

export class Hobby {
	_id?: ObjectID
	name: string
	from: Date
	to: Date
	level: number

	constructor() {
		this.name = getHobbyName()
		this.from = date.past()
		this.to = date.recent()
		this.level = random.number({
			min: 0,
			max: 10,
			precision: 1,
		})
	}
}

export class Travel {
	_id?: ObjectID
	from: string
	to: string
	duration: number
	price: number
	startDate: Date
	passengers: ObjectID[]

	constructor() {
		this.from = address.country()
		this.to = address.country()
		this.duration = random.number({
			min: 1,
			max: 5,
			precision: 1,
		})
		this.price = random.number({
			min: 100,
			max: 1000000,
			precision: 1,
		})
		this.startDate = date.past()
		this.passengers = []
	}
}

export class Airport {
	_id?: ObjectID
	city: string
	employees: ObjectID[]
	clients: ObjectID[]
	boss: ObjectID | null

	constructor() {
		this.city = address.city()
		this.employees = []
		this.clients = []
		this.boss = null
	}
}
