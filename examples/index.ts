import { MongODMEntity } from '../src/entity'
import { MongODMField } from '../src/decorators/field.decorator'
import { MongODMIndex } from '../src/decorators/index.decorator'
import { MongODMConnection } from '../src/connection'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from '../src/decorators/relation.decorator'

class Job extends MongODMEntity {
	@MongODMField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

class Hobby extends MongODMEntity {
	@MongODMField()
	customId: ObjectID

	@MongODMField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
		this.customId = new ObjectID()
	}
}

class User extends MongODMEntity {
	// Email is indexed and must be unique
	@MongODMIndex({
		unique: true,
	})
	email: string

	// First name is indexed
	@MongODMIndex({
		unique: false,
	})
	firstname: string

	// Is not an index and will be saved
	@MongODMField()
	passwordNotHashedLOL: string

	// Not decorator, will not be saved
	age: number

	@MongODMRelation({
		populatedKey: 'job',
		targetType: Job,
		targetKey: '_id',
	})
	jobId?: ObjectID
	job?: Job

	@MongODMRelation({
		populatedKey: 'jobs',
		targetKey: '_id',
		targetType: Job,
	})
	jobIds?: ObjectID[]
	jobs?: Job[]

	@MongODMRelation({
		populatedKey: 'hobby',
		targetType: Hobby,
		targetKey: 'customId',
	})
	hobbyId?: ObjectID
	hobby?: Hobby

	constructor(email: string, password: string) {
		super()
		this.email = email
		this.passwordNotHashedLOL = password
		this.firstname = 'Damien'
		this.age = new Date().getFullYear() - 1986
	}

	setJob(jobId: ObjectID) {
		this.jobId = jobId
	}

	setJobs(jobIds: ObjectID[]) {
		this.jobIds = jobIds
	}

	setHobby(hobbyId: ObjectID) {
		this.hobbyId = hobbyId
	}
}

// Connect to Mongo
const databaseName = 'mongODMexample'

new MongODMConnection({
	databaseName,
})
	.connect({
		clean: true,
	})
	.then(async (connection) => {
		// Connected to Mongo database
		console.log('Your are now connected')

		// Clean all collections
		await connection.clean()

		// Delete all users
		await User.delete(connection)

		// Create first user
		const user = new User('damien@dev.fr', 'azerty123')

		user.events.beforeInsert.subscribe(() => {
			console.log('Event before insert user')
		})

		user.events.afterInsert.subscribe(() => {
			console.log('Event after insert user.')
		})

		const userId = await user.insert(connection)
		// User added
		console.log('User added. MongoID = ' + userId)

		// Change email
		User.update(
			connection,
			{ email: 'toto@toto.com' },
			{ email: 'damien@dev.fr' }
		)
		// Find with new email
		const updatedUser = await User.findOne<User>(connection, {
			email: 'toto@toto.com',
		})

		if (!updatedUser) {
			throw new Error()
		}

		console.log('New email = ' + updatedUser.email)

		// Create a job
		const job = new Job('Lead dev !!')

		try {
			const inserted = await job.insert(connection)
			user.setJob(inserted)
			await user.update(connection)
		} catch (error) {
			console.error(JSON.stringify(error))
		}

		// Create hooby
		const hobby = new Hobby('Make JS great again !')
		await hobby.insert(connection)

		user.setHobby(hobby.customId)
		await user.update(connection)

		const jobsSavedIds: ObjectID[] = []
		// // Create jobs
		// for (let i = 0; i < 200; i++) {
		// 	const jobForList = new Job('Dev JS number ' + i)
		// 	jobsSavedIds.push(await jobForList.insert(connection))
		// }
		// // Add jobs to user
		// user.setJobs(jobsSavedIds)
		await user.update(connection)

		const populated = await user.populate(connection)

		console.log('Script executed :)')
	})
	.catch((err) => {
		console.error(err)
	})
