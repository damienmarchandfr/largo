import { MongORMEntity } from '../src/entity'
import { MongORMField } from '../src/decorators/field.decorator'
import { MongORMIndex } from '../src/decorators/index.decorator'
import { MongORMConnection } from '../src/connection'

// Create a User class will create a collection names 'user'

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

	constructor(email: string, password: string) {
		super()
		this.email = email
		this.passwordNotHashedLOL = password
		this.firstname = 'Damien'
		this.age = new Date().getFullYear() - 1986
	}
}

// Connect to Mongo
const databaseName = 'mongORMexample'

new MongORMConnection({
	databaseName,
})
	.connect()
	.then(async (connection) => {
		// Connected to Mongo database
		console.log('Your are now connected')
		// Clean collections user
		await User.delete(connection)
		// Create first user
		const user = new User('damien@dev.fr', 'azerty123')
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
	})
	.catch((err) => {
		console.error(err)
	})
