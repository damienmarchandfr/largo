import mongoose from 'mongoose'

// Native connection
import { ObjectID } from 'mongodb'
import { MongORMConnection } from '../../src/connection'
import { UserORM } from '../models/User.orm'
import { AirportORM } from '../models/Airport.orm'
import { HobbyORM } from '../models/Hobby.orm'
import { JobORM } from '../models/Job.orm'
import { TravelORM } from '../models/Travel.orm'
import { drop, QUANTITIES } from '../helper'

const url = 'mongodb://localhost:27017'
const databaseName = 'mongorm_populate'

drop(url, databaseName)
	.then(async () => {
		// Connect ORM
		const connect = await new MongORMConnection({
			databaseName,
		}).connect()

		console.log('MongORM connected.')

		const airports: AirportORM[] = []
		const hobbies: HobbyORM[] = []
		const jobs: JobORM[] = []
		const travels: TravelORM[] = []
		const users: UserORM[] = []

		for (let i = 0; i < QUANTITIES.airports; i++) {
			const airport = new AirportORM()
			await airport.insert(connect)
			airports.push(airport)
		}

		for (let j = 0; j < QUANTITIES.hobbies; j++) {
			const hobby = new HobbyORM()
			await hobby.insert(connect)
			hobbies.push(hobby)
		}

		for (let j = 0; j < QUANTITIES.jobs; j++) {
			const job = new JobORM()
			await job.insert(connect)
			jobs.push(job)
		}

		for (let j = 0; j < QUANTITIES.travels; j++) {
			const travel = new TravelORM()
			await travel.insert(connect)
			travels.push(travel)
		}

		for (let j = 0; j < QUANTITIES.users; j++) {
			const user = new UserORM()
			await user.insert(connect)
			users.push(user)
		}

		const updatePromises: Array<Promise<any>> = []

		const usersIds = users.map((user) => {
			return user._id as ObjectID
		})

		airports.forEach((airport) => {
			airport.clientsIds = usersIds
			airport.employeesIds = usersIds
			airport.bossId = usersIds[0]
			updatePromises.push(airport.update(connect))
		})

		jobs.forEach((job) => {
			job.employesIds = usersIds
			updatePromises.push(job.update(connect))
		})

		travels.forEach((travel) => {
			travel.passengersIds = usersIds
			updatePromises.push(travel.update(connect))
		})

		users.forEach((user) => {
			user.hobbiesIds = hobbies.map((hobby) => {
				return hobby._id as ObjectID
			})
			user.jobsIds = jobs.map((job) => {
				return job._id as ObjectID
			})
			updatePromises.push(user.update(connect))
		})

		await Promise.all(updatePromises)

		const allUsersFound = await UserORM.find(connect, {})

		const populateUsersPromises = allUsersFound.map((found) => {
			return found.populate(connect)
		})

		const hrstart = process.hrtime()
		await Promise.all(populateUsersPromises)
		const hrend = process.hrtime(hrstart)

		console.info(
			'Execution time for MongORM: %ds %dms',
			hrend[0],
			hrend[1] / 1000000
		)
	})
	.catch((err) => {
		console.error(err)
	})
