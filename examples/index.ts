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
	.then(async () => {
		// Connected to Mongo database
		console.log('Your are now connected')

		// Create first user
		const user = new User('damien@dev.fr', 'azerty123')

		user.beforeInsert().subscribe(() => {
			console.log('Event before insert user')
		})

		user.afterInsert().subscribe(() => {
			console.log('Event after insert user.')
		})

		console.log('User will be saved')
		const userId = await user.insert()
		// User added
		console.log('User added. MongoID = ' + userId)

		// Change email
		await User.updateMany<User>(
			{ email: 'damien@dev.fr' },
			{ email: 'john@doe.fr' }
		)
		// Find with new email
		const updatedUser = await User.findOne<User>({
			email: 'john@doe.fr',
		})

		if (!updatedUser) {
			throw new Error()
		}

		console.log('New email = ' + updatedUser.email)

		// Create a job
		const job = new Job('Lead dev !!')

		const inserted = await job.insert()
		user.setJob(inserted)
		await user.update()

		// Create hooby
		const hobby = new Hobby('Make JS great again !')
		await hobby.insert()

		user.setHobby(hobby.customId)
		await user.update()

		const jobsSavedIds: ObjectID[] = []

		// Create jobs
		for (let i = 0; i < 2; i++) {
			const jobForList = new Job('Dev JS number ' + i)
			jobsSavedIds.push(await jobForList.insert())
		}
		// Add jobs to user
		user.setJobs(jobsSavedIds)
		await user.update()

		const populated = await user.populate()

		// Create a second user
		const user2 = new User('jeremy@dev.fr', 'azerty123')
		user2.firstname = 'Jeremy'

		await user2.insert()

		// Add a hobby to user 2
		user2.hobbyId = hobby.customId
		await user2.update()

		// Add jobs to user
		user2.setJobs(jobsSavedIds)
		await user2.update()

		// Populate many
		const users = await User.find<User>({})

		// const populatedM = await users.populate(connection)

		console.log('Script executed :)')
	})
	.catch((err) => {
		console.error(err)
	})
