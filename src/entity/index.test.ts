import { MongORMConnection, generateCollectionName } from '../connection'
import { MongORMEntity } from '.'
import { MongORMField } from '../decorators/field.decorator'
import { exec } from 'child_process'
import { cpus } from 'os'

const databaseName = 'entitytest'

describe(`MongORM class`, () => {
	describe('findOne static method', () => {
		it('should findOne', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor() {
					super()
					this.email = 'damien@marchand.fr'
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert user with mongodb native lib
			await connection.collections.user.insertOne(new User())

			const user = await User.findOne(connection, {
				email: 'damien@marchand.fr',
			})

			expect(user.email).toEqual('damien@marchand.fr')
		})

		it('should not find and return null', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor() {
					super()
					this.email = 'damien@marchand.fr'
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert user with mongodb native lib
			await connection.collections.user.insertOne(new User())

			const user = await User.findOne(connection, {
				email: 'donal@trump.usa',
			})

			expect(user).toEqual(null)
		})
	})

	describe(`update static method`, () => {
		it('should update one element with query filter', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert user with mongodb native lib
			await connection.collections.user.insertMany([
				new User('damien@marchand.fr'),
				new User('donald@trump.usa'),
			])

			// Update
			await User.update(
				connection,
				{ email: 'barack@obama.usa' },
				{ email: 'donald@trump.usa' }
			)

			// Search with email
			const trump = await connection.collections.user.findOne({
				email: 'donald@trump.usa',
			})

			expect(trump).toEqual(null)

			const barack = await connection.collections.user.findOne({
				email: 'barack@obama.usa',
			})

			expect(barack.email).toEqual('barack@obama.usa')
		})
	})

	describe('delete static method', () => {
		it('shoud delete with query filter', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Add 2 users
			await connection.collections.user.insertMany([
				new User('damien@marchand.fr'),
				new User('donald@trump.usa'),
			])

			// Delete donald
			await User.delete(connection, { email: 'donald@trump.usa' })

			// Searhc for donald
			const donald = await connection.collections.user.findOne({
				email: 'donald@trump.usa',
			})

			expect(donald).toEqual(null)
		})

		it('should delete all if no query filter', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Add 2 users
			await connection.collections.user.insertMany([
				new User('damien@marchand.fr'),
				new User('donald@trump.usa'),
			])

			// Delete all users
			await User.delete(connection)

			// Searhc for donald
			const countUser = await connection.collections.user.countDocuments()

			expect(countUser).toEqual(0)
		})
	})

	describe('insert method', () => {
		it('should insert', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Check if collection if empty
			const count = await connection.collections.user.countDocuments()
			expect(count).toEqual(0)

			const user = new User('damien@dev.fr')
			const userId = await user.insert(connection)

			// One user created
			expect(userId).toStrictEqual(user._id as {})

			// Check with id
			const userRetrived = await connection.collections.user.findOne({
				_id: userId,
			})
			expect(userRetrived.email).toEqual(user.email)
		})

		it('should not insert fields without decorator', async () => {
			class NoDecoratorSaved extends MongORMEntity {
				@MongORMField()
				email: string

				personal: string

				constructor(email: string) {
					super()
					this.email = email
					this.personal = 'love cat'
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const obj = new NoDecoratorSaved('damien@dev.fr')

			const id = await obj.insert(connection)

			const saved = await connection.collections[
				generateCollectionName(new NoDecoratorSaved('toto'))
			].findOne({ _id: id })

			expect(saved).toStrictEqual({
				_id: id,
				email: 'damien@dev.fr',
			})
		})
	})

	describe('update methode', () => {
		it('should update', async () => {
			class User extends MongORMEntity {
				@MongORMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = new User('damien@dev.fr')

			// Insert a user with mongo native
			const insertResult = await connection.collections.user.insertOne(user)

			user._id = insertResult.insertedId

			// Update email
			user.email = 'jeremy@dev.fr'
			await user.update(connection)

			// Find user
			const updated = await connection.collections.user.findOne({
				_id: insertResult.insertedId,
			})

			expect(updated.email).toEqual(user.email)
		})

		it('should not update prop without decorator', async () => {
			class UserUpdateNotDecorator extends MongORMEntity {
				@MongORMField()
				email: string

				age: number

				constructor(email: string) {
					super()
					this.email = email
					this.age = 2
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = new UserUpdateNotDecorator('damien@dev.fr')

			// Add user
			const userCopy = { ...user }
			delete userCopy.age

			const collectionName = generateCollectionName(
				new UserUpdateNotDecorator('toto')
			)
			const insertResult = await connection.collections[
				collectionName
			].insertOne(userCopy)

			// Update
			user.age = 18
			await user.update(connection)

			// Get user in db
			const saved = await connection.collections[collectionName].findOne({
				_id: insertResult.insertedId,
			})

			expect(saved.age).toBeUndefined()
		})
	})
})
