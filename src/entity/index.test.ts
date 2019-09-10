import { MongORMConnection, generateCollectionName } from '../connection'
import { MongORMEntity } from '.'
import { MongORMField } from '../decorators/field.decorator'
import { async } from 'rxjs/internal/scheduler/async'
import { doesNotReject } from 'assert'

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

	describe('countDocuments static method', () => {
		it('should count all documents', async () => {
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

			const users: User[] = []
			// Add 10 users
			for (let i = 0; i < 10; i++) {
				users.push(new User('damien@dev.fr'))
			}
			await connection.collections.user.insertMany(users)

			const count = await User.countDocuments(connection)
			expect(count).toEqual(10)
		})

		it('should count documents with query filter', async () => {
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

			const users: User[] = []
			// Add 10 users
			for (let i = 0; i < 10; i++) {
				users.push(new User('damien@dev.fr'))
			}
			// User in filter
			users.push(new User('jeremy@dev.fr'))

			await connection.collections.user.insertMany(users)

			const count = await User.countDocuments(connection, {
				email: 'jeremy@dev.fr',
			})
			expect(count).toEqual(1)
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

		it('should trigger beforeInsert', async (done) => {
			class User extends MongORMEntity {
				@MongORMField()
				firstname: string

				constructor() {
					super()
					this.firstname = 'Damien'
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = new User()

			user.events.beforeInsert.subscribe((userToInsert) => {
				expect(userToInsert.firstname).toEqual('Damien')
				expect(userToInsert._id).not.toBeDefined()
				done()
			})

			await user.insert(connection)
		})

		it('should trigger afterInsert', async (done) => {
			class User extends MongORMEntity {
				@MongORMField()
				firstname: string

				constructor() {
					super()
					this.firstname = 'Damien'
				}
			}

			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = new User()

			user.events.afterInsert.subscribe((userSaved) => {
				expect(userSaved.firstname).toEqual('Damien')
				expect(userSaved._id).toBeDefined()
				done()
			})

			await user.insert(connection)
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

		it('should trigger beforeUpdate', async (done) => {
			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			class User extends MongORMEntity {
				@MongORMField()
				firstname: string

				constructor(firstname: string) {
					super()
					this.firstname = firstname
				}
			}

			const user = await connection.collections.user.insertOne({
				firstname: 'Damien',
			})
			const id = user.insertedId

			const updateUser = new User('Damien')
			updateUser._id = id

			updateUser.events.beforeUpdate.subscribe((update) => {
				const source = update.oldValue
				const partial = update.partial

				expect(source._id).toBeDefined()
				expect(source.firstname).toEqual('Damien')

				expect(partial._id).not.toBeDefined()
				expect(partial.firstname).toEqual('Jeremy')

				done()
			})

			updateUser.firstname = 'Jeremy'
			await updateUser.update(connection)
		})

		it('should trigger afterUpdate', async (done) => {
			const connection = await new MongORMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			class User extends MongORMEntity {
				@MongORMField()
				firstname: string

				constructor(firstname: string) {
					super()
					this.firstname = firstname
				}
			}

			const user = await connection.collections.user.insertOne({
				firstname: 'Damien',
			})
			const id = user.insertedId

			const updateUser = new User('Damien')
			updateUser._id = id

			updateUser.events.afterUpdate.subscribe((updateResult) => {
				const before = updateResult.oldValue
				const after = updateResult.newValue

				expect(before._id).toBeDefined()
				expect(before._id).toStrictEqual(after._id)

				expect(before.firstname).toEqual('Damien')
				expect(after.firstname).toEqual('Jeremy')

				done()
			})

			updateUser.firstname = 'Jeremy'
			await updateUser.update(connection)
		})
	})

	describe('delete methode', () => {
		it('should delete', async () => {
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

			const insertResult = await connection.collections.user.insertOne(user)
			user._id = insertResult.insertedId

			// Check user in db
			const check = await connection.collections.user.findOne({ _id: user._id })
			expect(check.email).toEqual(user.email)

			// Delete
			await user.delete(connection)
			const checkDeleted = await connection.collections.user.findOne({
				_id: user._id,
			})
			expect(checkDeleted).toEqual(null)
		})

		it('should trigger beforeDelete', async (done) => {
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

			const inserted = await connection.collections.user.insertOne({
				email: 'damien@dev.fr',
			})

			const user = new User('damien@de.fr')
			user._id = inserted.insertedId

			user.events.beforeDelete.subscribe((userBeforeDelete) => {
				expect(userBeforeDelete._id).toStrictEqual(inserted.insertedId)
				done()
			})

			await user.delete(connection)
		})

		it('should trigger afterDelete', async (done) => {
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

			const inserted = await connection.collections.user.insertOne({
				email: 'damien@dev.fr',
			})

			const user = new User('damien@dev.fr')
			user._id = inserted.insertedId

			user.events.afterDelete.subscribe(async (userDeleted) => {
				expect(userDeleted._id).toStrictEqual(inserted.insertedId)

				// Check if in db
				const checkUser = await connection.collections.user.findOne({
					_id: inserted.insertedId,
				})

				expect(checkUser).toEqual(null)

				done()
			})

			await user.delete(connection)
		})
	})
})
