import { LegatoEntity } from '../src/entity'
import { LegatoField } from '../src/decorators/field.decorator'
import { LegatoIndex } from '../src/decorators/index.decorator'
import { LegatoConnection } from '../src/connection'
import { ObjectID } from 'mongodb'
import { LegatoRelation } from '../src/decorators/relation.decorator'

class Job extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

class Hobby extends LegatoEntity {
	@LegatoField()
	customId: ObjectID

	@LegatoField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
		this.customId = new ObjectID()
	}
}

class User extends LegatoEntity {
	// Email is indexed and must be unique
	@LegatoIndex({
		unique: true,
	})
	email: string

	// First name is indexed
	@LegatoIndex({
		unique: false,
	})
	firstname: string

	// Is not an index and will be saved
	@LegatoField()
	passwordNotHashedLOL: string

	// Not decorator, will not be saved
	age: number

	@LegatoRelation({
		populatedKey: 'job',
		targetType: Job,
		targetKey: '_id',
	})
	jobId?: ObjectID
	job?: Job

	@LegatoRelation({
		populatedKey: 'jobs',
		targetKey: '_id',
		targetType: Job,
	})
	jobIds?: ObjectID[]
	jobs?: Job[]

	@LegatoRelation({
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
const databaseName = 'Legatoexample'

new LegatoConnection({
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
		await User.deleteMany(connection)

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
		User.updateMany<User>(
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

		// Create jobs
		for (let i = 0; i < 2; i++) {
			const jobForList = new Job('Dev JS number ' + i)
			jobsSavedIds.push(await jobForList.insert(connection))
		}
		// Add jobs to user
		user.setJobs(jobsSavedIds)
		await user.update(connection)

		const populated = await user.populate<User>(connection)

		// Create a second user
		const user2 = new User('jeremy@dev.fr', 'azerty123')
		user2.firstname = 'Jeremy'

		await user2.insert(connection)

		// Add a hobby to user 2
		user2.hobbyId = hobby.customId
		await user2.update(connection)

		// Add jobs to user
		user2.setJobs(jobsSavedIds)
		await user2.update(connection)

		// Populate many
		const users = await User.find<User>(connection, {})

		// const populatedM = await users.populate(connection)

		console.log('Script executed :)')
	})
	.catch((err) => {
		console.error(err)
	})
