import { MongODMConnection } from './connection'
import { MongODMEntity, getMongODMPartial } from './entity'
import { MongODMField } from './decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from './decorators/relation.decorator'
import { MongODMIndex } from './decorators/index.decorator'

const databaseName = 'entitytest'

describe(`MongODM class`, () => {
	describe('find static method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecorator.find<RandomClassWithoutDecorator>(
					connection,
					{ name: 'toto' }
				)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should find all with empty filter', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert users with mongodb native lib
			await connection.collections.user.insertOne(new User('damien@dev.fr'))
			await connection.collections.user.insertOne(new User('jeremy@dev.fr'))

			const users = await User.find(connection, {})

			expect(users.length()).toEqual(2)
		})

		it('should not find and return emtpy array', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor() {
					super()
					this.email = 'damien@marchand.fr'
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			await new User().insert(connection)

			const bads = await User.find(connection, {
				email: 'donal@trump.usa',
			})

			expect(bads.length()).toEqual(0)
		})
	})

	describe('findOne static method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecorator.findOne(connection, { name: 'toto' })
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should findOne', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor() {
					super()
					this.email = 'damien@marchand.fr'
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert user with mongodb native lib
			await connection.collections.user.insertOne(new User())

			const user = await User.findOne(connection, {
				email: 'damien@marchand.fr',
			})

			expect(user).not.toBe(null)
			expect((user as User).email).toEqual('damien@marchand.fr')
		})

		it('should not find and return null', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor() {
					super()
					this.email = 'damien@marchand.fr'
				}
			}

			const connection = await new MongODMConnection({
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
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecorator.updateMany<
					RandomClassWithoutDecorator
				>(connection, { name: 'titi' }, { name: 'toto' })
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should update one element with query filter', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			await User.updateMany<User>(
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
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecorator.deleteMany(connection, {
					name: 'toto',
				})
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('shoud delete with query filter', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			await User.deleteMany<User>(connection, { email: 'donald@trump.usa' })

			// Searhc for donald
			const donald = await connection.collections.user.findOne({
				email: 'donald@trump.usa',
			})

			expect(donald).toEqual(null)
		})

		it('should delete all if no query filter', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			await User.deleteMany(connection)

			// Searhc for donald
			const countUser = await connection.collections.user.countDocuments()

			expect(countUser).toEqual(0)
		})
	})

	describe('countDocuments static method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecorator.countDocuments(connection, {
					name: 'toto',
				})
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should count all documents', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await new RandomClassWithoutDecorator().insert(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should insert', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			class NoDecoratorSaved extends MongODMEntity {
				@MongODMField()
				email: string

				personal: string

				constructor(email: string) {
					super()
					this.email = email
					this.personal = 'love cat'
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const obj = new NoDecoratorSaved('damien@dev.fr')

			const id = await obj.insert(connection)

			const saved = await connection.collections.nodecoratorsaved.findOne({
				_id: id,
			})

			expect(saved).toStrictEqual({
				_id: id,
				email: 'damien@dev.fr',
			})
		})

		it('should trigger beforeInsert', async (done) => {
			class User extends MongODMEntity {
				@MongODMField()
				firstname: string

				constructor() {
					super()
					this.firstname = 'Damien'
				}
			}

			const connection = await new MongODMConnection({
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
			class User extends MongODMEntity {
				@MongODMField()
				firstname: string

				constructor() {
					super()
					this.firstname = 'Damien'
				}
			}

			const connection = await new MongODMConnection({
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

		it('should return an error if relations set does not exist', async () => {
			const objectIDset = new ObjectID()
			class JobRelationDecoratorInvalidRelation extends MongODMEntity {
				@MongODMField()
				companyName: string

				constructor() {
					super()
					this.companyName = 'company name'
				}
			}

			class UserRelationDecoratorInvalidRelation extends MongODMEntity {
				@MongODMField()
				email: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobRelationDecoratorInvalidRelation,
				})
				jobId: ObjectID | null = null
				job?: JobRelationDecoratorInvalidRelation | null

				constructor() {
					super()
					this.email = 'damien@mail.com'
					this.jobId = objectIDset // No job with this _id
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Insert Job
			await new JobRelationDecoratorInvalidRelation().insert(connection)

			// Insert User with jobId not in database
			let hasError = false

			try {
				await new UserRelationDecoratorInvalidRelation().insert(connection)
			} catch (error) {
				const message = `You set jobId : ${objectIDset.toHexString()} on object UserRelationDecoratorInvalidRelation. JobRelationDecoratorInvalidRelation with _id : ${objectIDset.toHexString()} does not exists.`
				expect(error.message).toEqual(message)
				hasError = true
			}

			expect(hasError).toEqual(true)
		})
	})

	describe('update methode', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			const id = new ObjectID()

			const random = new RandomClassWithoutDecorator()
			random._id = id

			try {
				await random.update(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
			}

			expect(hasError).toEqual(true)
		})

		it('should update', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			class UserUpdateNotDecorator extends MongODMEntity {
				@MongODMField()
				email: string

				age: number

				constructor(email: string) {
					super()
					this.email = email
					this.age = 2
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = new UserUpdateNotDecorator('damien@dev.fr')

			// Add user
			const userCopy = { ...user }
			delete userCopy.age

			const insertResult = await connection.collections.userupdatenotdecorator.insertOne(
				userCopy
			)

			// Update
			user.age = 18
			await user.update(connection)

			// Get user in db
			const saved = await connection.collections.userupdatenotdecorator.findOne(
				{
					_id: insertResult.insertedId,
				}
			)

			expect(saved.age).toBeUndefined()
		})

		it('should trigger beforeUpdate', async (done) => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			class User extends MongODMEntity {
				@MongODMField()
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
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			class User extends MongODMEntity {
				@MongODMField()
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
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecorator extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			const random = new RandomClassWithoutDecorator()
			const id = new ObjectID()
			random._id = id

			try {
				await random.delete(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecorator does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should delete', async () => {
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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
			class User extends MongODMEntity {
				@MongODMField()
				email: string

				constructor(email: string) {
					super()
					this.email = email
				}
			}

			const connection = await new MongODMConnection({
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

	describe('populate method', () => {
		it('should populate with _id by default', async () => {
			class JobPopulate extends MongODMEntity {
				@MongODMField()
				name: string

				constructor(name: string) {
					super()
					this.name = name
				}
			}

			class UserPopulate extends MongODMEntity {
				@MongODMField()
				firstname: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobPopulate,
				})
				jobId: ObjectID
				job?: JobPopulate

				@MongODMRelation({
					populatedKey: 'job2',
					targetType: JobPopulate,
				})
				jobId2: ObjectID
				job2?: JobPopulate

				@MongODMRelation({
					populatedKey: 'jobs',
					targetType: JobPopulate,
				})
				jobIds: ObjectID[]
				jobs?: JobPopulate[]

				constructor(savedJobId: ObjectID, savedJobId2: ObjectID) {
					super()
					this.firstname = 'Damien'
					this.jobId = savedJobId
					this.jobId2 = savedJobId2
					this.jobIds = [this.jobId, this.jobId2]
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const job = new JobPopulate('js dev')
			const jobId = await job.insert(connection)

			const job2 = new JobPopulate('php dev')
			const job2id = await job2.insert(connection)

			const user = new UserPopulate(jobId, job2id)
			await user.insert(connection)

			const userPopulated = await user.populate<UserPopulate>(connection)
			expect(userPopulated.job).toStrictEqual({
				_id: jobId,
				name: 'js dev',
			})
			expect(userPopulated.job2).toStrictEqual({
				_id: job2id,
				name: 'php dev',
			})

			expect((userPopulated.jobs as JobPopulate[]).length).toEqual(2)
		})

		it('should populate with other key for relation', async () => {
			class JobPopulateCustomKey extends MongODMEntity {
				@MongODMField()
				name: string

				@MongODMField()
				customJobId: ObjectID

				constructor(name: string) {
					super()
					this.customJobId = new ObjectID()
					this.name = name
				}
			}

			class UserPopulateCustomKey extends MongODMEntity {
				@MongODMField()
				firstname: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobPopulateCustomKey,
					targetKey: 'customJobId',
				})
				jobId: ObjectID
				job?: JobPopulateCustomKey

				@MongODMRelation({
					populatedKey: 'jobs',
					targetType: JobPopulateCustomKey,
					targetKey: 'customJobId',
				})
				jobIds: ObjectID[]
				jobs?: JobPopulateCustomKey[]

				constructor(savedJobId: ObjectID) {
					super()
					this.firstname = 'Damien'
					this.jobId = savedJobId
					this.jobIds = [savedJobId]
				}

				addJob(savedJobId: ObjectID) {
					this.jobIds.push(savedJobId)
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const job = new JobPopulateCustomKey('js dev')
			const generatedJobId = await job.insert(connection)
			const jobId = job.customJobId

			const job2 = new JobPopulateCustomKey('c++ dev')
			await job2.insert(connection)
			const job2Id = job2.customJobId

			const user = new UserPopulateCustomKey(jobId)
			user.addJob(job2Id)
			await user.insert(connection)

			const userPopulated = await user.populate<UserPopulateCustomKey>(
				connection
			)

			expect(userPopulated.job).toStrictEqual({
				_id: generatedJobId,
				name: 'js dev',
				customJobId: job.customJobId,
			})

			expect(userPopulated.jobId).toEqual(job.customJobId)
			expect((userPopulated.jobs as JobPopulateCustomKey[]).length).toEqual(2)
		})

		it('should populate with string as id', async () => {
			class JobPopulateIdString extends MongODMEntity {
				@MongODMField()
				name: string

				@MongODMIndex({
					unique: true,
				})
				customJobId: string

				constructor() {
					super()
					this.name = 'C# dev'
					this.customJobId =
						'customValue' +
						Math.random()
							.toString(36)
							.substring(2, 15)
				}
			}

			class UserPopulateIdString extends MongODMEntity {
				@MongODMField()
				email: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobPopulateIdString,
					targetKey: 'customJobId',
				})
				jobId: string
				job?: JobPopulateIdString

				@MongODMRelation({
					populatedKey: 'jobs',
					targetType: JobPopulateIdString,
					targetKey: 'customJobId',
				})
				jobIds: string[]
				jobs?: JobPopulateIdString[]

				constructor(customJobId: string) {
					super()
					this.email = 'damien@marchand.fr'
					this.jobId = customJobId
					this.jobIds = [customJobId]
				}

				addCustomJobId(jobId: string) {
					this.jobIds.push(jobId)
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Create job
			const job = new JobPopulateIdString()
			const jobIdCreated = await job.insert(connection)

			const job2 = new JobPopulateIdString()
			await job2.insert(connection)

			const user = new UserPopulateIdString(job.customJobId)
			user.addCustomJobId(job2.customJobId)
			await user.insert(connection)

			const userPopulated = await user.populate<UserPopulateIdString>(
				connection
			)

			expect(userPopulated.job).toStrictEqual({
				_id: jobIdCreated,
				name: 'C# dev',
				customJobId: job.customJobId,
			})

			expect(userPopulated.jobId).toEqual(job.customJobId)

			expect((userPopulated.jobs as JobPopulateIdString[]).length).toEqual(2)
		})

		it('should populate with number as id', async () => {
			class JobPopulateIdNumber extends MongODMEntity {
				@MongODMField()
				name: string

				@MongODMIndex({
					unique: true,
				})
				customJobId: number

				constructor(customJobId: number) {
					super()
					this.name = 'C# dev'
					this.customJobId = customJobId
				}
			}

			class UserPopulateIdNumber extends MongODMEntity {
				@MongODMField()
				email: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobPopulateIdNumber,
					targetKey: 'customJobId',
				})
				jobId: number
				job?: JobPopulateIdNumber

				@MongODMRelation({
					populatedKey: 'jobs',
					targetType: JobPopulateIdNumber,
					targetKey: 'customJobId',
				})
				jobIds: number[]
				jobs?: JobPopulateIdNumber[]

				constructor(jobId: number) {
					super()
					this.email = 'damien@marchand.fr'
					this.jobId = jobId
					this.jobIds = [jobId]
				}

				addJobId(jobId: number) {
					this.jobIds.push(jobId)
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			// Create job
			const job = new JobPopulateIdNumber(1)
			const jobIdCreated = await job.insert(connection)

			const job2 = new JobPopulateIdNumber(2)
			await job2.insert(connection)

			const user = new UserPopulateIdNumber(job.customJobId)
			user.addJobId(job2.customJobId)
			await user.insert(connection)

			const userPopulated = await user.populate<UserPopulateIdNumber>(
				connection
			)

			expect(userPopulated.job).toStrictEqual({
				_id: jobIdCreated,
				name: 'C# dev',
				customJobId: job.customJobId,
			})

			expect(userPopulated.jobId).toEqual(job.customJobId)

			expect((userPopulated.jobs as JobPopulateIdNumber[]).length).toEqual(2)
		})
	})
})

// describe('MongODMEntityArray class', () => {
// 	it('should populate with _id by default', async () => {
// 		class JobPopulateMany extends MongODMEntity {
// 			@MongODMIndex({
// 				unique: true,
// 			})
// 			name: string

// 			constructor(jobName: string) {
// 				super()
// 				this.name = jobName
// 			}
// 		}

// 		class UserPopulateMany extends MongODMEntity{
// 			@MongODMField()
// 			firstname : string

// 			constructor(){
// 				super()
// 				this.firstname = 'Damien'
// 			}

// 		}
// 	})
// })

describe('getMongODMPartial function', () => {
	it('should not return field without decorator', () => {
		class Full extends MongODMEntity {
			@MongODMIndex({
				unique: false,
			})
			firstname: string

			@MongODMField()
			lastname: string

			age: number

			constructor() {
				super()
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
			}
		}

		const partial = getMongODMPartial(new Full(), 'full')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
		})
	})

	it('should not return empty field', () => {
		class Full extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMField()
			age?: number

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const partial = getMongODMPartial(new Full(), 'full')

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
