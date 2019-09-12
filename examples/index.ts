import { MongORMEntity } from '../src/entity'
import { MongORMField } from '../src/decorators/field.decorator'
import { MongORMIndex } from '../src/decorators/index.decorator'
import { MongORMConnection } from '../src/connection'
import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'
import { MongORMRelation } from '../src/decorators/relation.decorator'
// Create a User class will create a collection names 'user'

class Job extends MongORMEntity {
	@MongORMField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

class Hobby extends MongORMEntity {
	@MongORMField()
	customId: ObjectID

	@MongORMField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
		this.customId = new ObjectID()
	}
}

class User extends MongORMEntity {
	// Email is indexed and must be unique
	@MongORMIndex({
		unique: true,
	})
	email: string

	// First name is indexed
	@MongORMIndex({
		unique: false,
	})
	firstname: string

	// Is not an index and will be saved
	@MongORMField()
	passwordNotHashedLOL: string

	// Not decorator, will not be saved
	age: number

	@MongORMRelation({
		populatedKey: 'job',
		targetType: Job,
		targetKey: '_id',
	})
	jobId?: ObjectID

	job?: Job

	@MongORMRelation({
		populatedKey: 'hobby',
		targetType: Hobby,
		targetKey: 'customId',
	})
	hobbyId?: ObjectID

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

	setHobby(hobbyId: ObjectID) {
		this.hobbyId = hobbyId
	}
}

// Connect to Mongo
const databaseName = 'mongORMexample'

new MongORMConnection({
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

		user.events.afterInsert.subscribe((u) => {
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
		const updatedUser = await User.findOne(connection, {
			email: 'toto@toto.com',
		})
		console.log('New email = ' + updatedUser.email)

		// Create a job
		const job = new Job('Lead dev !!')
		const inserted = await job.insert(connection)

		user.setJob(inserted)
		await user.update(connection)

		// Create hooby
		const hobby = new Hobby('Make JS great again !')
		await hobby.insert(connection)

		user.setHobby(hobby.customId)
		await user.update(connection)

		const r = await user.populate(connection)
		console.log(r)

		console.log('Script executed :)')
	})
	.catch((err) => {
		console.error(err)
	})
