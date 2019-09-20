// import mongoose from 'mongoose'

// // Native connection
// import { ObjectID } from 'mongodb'
// import { MongODMConnection } from '../../src/connection'
// import { UserODM } from '../models/User.odm'
// import { AirportODM } from '../models/Airport.odm'
// import { HobbyODM } from '../models/Hobby.odm'
// import { JobODM } from '../models/Job.odm'
// import { TravelODM } from '../models/Travel.odm'
// import { drop, QUANTITIES } from '../helper'

// const url = 'mongodb://localhost:27017'
// const databaseName = 'mongorm_populate'

// drop(url, databaseName)
// 	.then(async () => {
// 		// Connect ODM
// 		const connect = await new MongODMConnection({
// 			databaseName,
// 		}).connect()

// 		console.log('MongODM connected.')

// 		const airports: AirportODM[] = []
// 		const hobbies: HobbyODM[] = []
// 		const jobs: JobODM[] = []
// 		const travels: TravelODM[] = []
// 		const users: UserODM[] = []

// 		for (let i = 0; i < QUANTITIES.airports; i++) {
// 			const airport = new AirportODM()
// 			await airport.insert(connect)
// 			airports.push(airport)
// 		}

// 		for (let j = 0; j < QUANTITIES.hobbies; j++) {
// 			const hobby = new HobbyODM()
// 			await hobby.insert(connect)
// 			hobbies.push(hobby)
// 		}

// 		for (let j = 0; j < QUANTITIES.jobs; j++) {
// 			const job = new JobODM()
// 			await job.insert(connect)
// 			jobs.push(job)
// 		}

// 		for (let j = 0; j < QUANTITIES.travels; j++) {
// 			const travel = new TravelODM()
// 			await travel.insert(connect)
// 			travels.push(travel)
// 		}

// 		for (let j = 0; j < QUANTITIES.users; j++) {
// 			const user = new UserODM()
// 			await user.insert(connect)
// 			users.push(user)
// 		}

// 		const updatePromises: Array<Promise<any>> = []

// 		const usersIds = users.map((user) => {
// 			return user._id as ObjectID
// 		})

// 		airports.forEach((airport) => {
// 			airport.clientsIds = usersIds
// 			airport.employeesIds = usersIds
// 			airport.bossId = usersIds[0]
// 			updatePromises.push(airport.update(connect))
// 		})

// 		jobs.forEach((job) => {
// 			job.employesIds = usersIds
// 			updatePromises.push(job.update(connect))
// 		})

// 		travels.forEach((travel) => {
// 			travel.passengersIds = usersIds
// 			updatePromises.push(travel.update(connect))
// 		})

// 		users.forEach((user) => {
// 			user.hobbiesIds = hobbies.map((hobby) => {
// 				return hobby._id as ObjectID
// 			})
// 			user.jobsIds = jobs.map((job) => {
// 				return job._id as ObjectID
// 			})
// 			updatePromises.push(user.update(connect))
// 		})

// 		await Promise.all(updatePromises)

// 		const allUsersFound = await UserODM.find(connect, {})

// 		const populateUsersPromises = allUsersFound.map((found) => {
// 			return found.populate(connect)
// 		})

// 		const hrstart = process.hrtime()
// 		await Promise.all(populateUsersPromises)
// 		const hrend = process.hrtime(hrstart)

// 		console.info(
// 			'Execution time for MongODM: %ds %dms',
// 			hrend[0],
// 			hrend[1] / 1000000
// 		)
// 	})
// 	.catch((err) => {
// 		console.error(err)
// 	})
