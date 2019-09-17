import mongoose, { Document } from 'mongoose'
import { drop, QUANTITIES } from '../helper'
import { Airport, Job, Travel, Hobby, User } from '../data'

const url = 'mongodb://localhost:27017'
const databaseName = 'mongoose_populate'

const userMongooseShema = new mongoose.Schema({
	firstname: String,
	lastname: String,

	// Relations
	jobs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Job',
		},
	],

	hobbies: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hobby',
		},
	],
})

const jobMongooseSchema = new mongoose.Schema({
	name: String,
	years: Number,
	description: String,
	companyName: String,
	numberOfEmployes: Number,

	employes: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
})

const hobbySchema = new mongoose.Schema({
	name: String,
	from: Date,
	to: Date,
	level: Number,
})

const travelSchema = new mongoose.Schema({
	from: String,
	to: String,
	duration: Number,
	price: Number,
	startDate: Date,

	passengers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
})

const airportSchema = new mongoose.Schema({
	city: String,

	clients: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],

	employees: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],

	boss: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
})

const userModel = mongoose.model('User', userMongooseShema)
const jobModel = mongoose.model('Job', jobMongooseSchema)
const hobbyModel = mongoose.model('Hobby', hobbySchema)
const travelModel = mongoose.model('Travel', travelSchema)
const airportModel = mongoose.model('Airport', airportSchema)

drop(url, databaseName).then(() => {
	mongoose.connect(url + '/' + databaseName, {
		useNewUrlParser: true,
	})
	const db = mongoose.connection

	db.on('open', async () => {
		const airportsDocuments: Document[] = []
		const jobsDocuments: Document[] = []
		const travelsDocuments: Document[] = []
		const hobbiesDocuments: Document[] = []
		const usersDocuments: Document[] = []

		for (let i = 0; i < QUANTITIES.airports; i++) {
			const airport = new Airport()
			const airportMongoose = new airportModel({
				city: airport.city,
			})
			airportsDocuments.push(await airportMongoose.save())
		}

		for (let j = 0; j < QUANTITIES.jobs; j++) {
			const job = new Job()

			const jobMongoose = new jobModel({
				name: job.name,
				years: job.years,
				description: job.description,
				companyName: job.companyName,
				numberOfEmployes: job.numberOfEmployes,
			})
			jobsDocuments.push(await jobMongoose.save())
		}

		for (let t = 0; t < QUANTITIES.travels; t++) {
			const travel = new Travel()
			const travelMongoose = new travelModel({
				from: travel.from,
				to: travel.to,
				duration: travel.duration,
				price: travel.price,
				startDate: travel.startDate,
			})
			travelsDocuments.push(await travelMongoose.save())
		}

		for (let h = 0; h < QUANTITIES.hobbies; h++) {
			const hobby = new Hobby()
			const hobbyMongoose = new hobbyModel({
				name: hobby.name,
				from: hobby.from,
				to: hobby.to,
				level: hobby.level,
			})
			hobbiesDocuments.push(await hobbyMongoose.save())
		}

		for (let u = 0; u < QUANTITIES.users; u++) {
			const user = new User()
			const userMongoose = new userModel({
				firstname: user.firstname,
				lastname: user.lastname,
			})
			usersDocuments.push(await userMongoose.save())
		}

		// Save relations
		const updatePromises: Array<Promise<any>> = []

		const usersIds = usersDocuments.map((user) => {
			return user._id
		})

		airportsDocuments.forEach((airport) => {
			updatePromises.push(
				airport
					.updateOne({
						clients: usersIds,
						employees: usersIds,
						boss: usersIds[0],
					})
					.exec()
			)
		})

		jobsDocuments.forEach((job) => {
			updatePromises.push(
				job
					.updateOne({
						employees: usersIds,
					})
					.exec()
			)
		})

		travelsDocuments.forEach((travel) => {
			updatePromises.push(
				travel
					.updateOne({
						passengers: usersIds,
					})
					.exec()
			)
		})

		usersDocuments.forEach((user) => {
			updatePromises.push(
				user
					.updateOne({
						hobbies: hobbiesDocuments.map((h) => {
							return h._id
						}),
						jobs: jobsDocuments.map((j) => {
							return j._id
						}),
					})
					.exec()
			)
		})

		await Promise.all(updatePromises)

		const allUsersFound = await userModel.find({}).exec()

		const populateUsersPromise = allUsersFound.map((found) => {
			return found
				.populate('jobs')
				.populate('hobbies')
				.execPopulate()
		})

		const hrstart = process.hrtime()
		await Promise.all(populateUsersPromise)
		const hrend = process.hrtime(hrstart)

		console.info(
			'Execution time for Mongoose: %ds %dms',
			hrend[0],
			hrend[1] / 1000000
		)
	})

	db.on('error', (error) => {
		throw error
	})
})
