import { MongODMConnection } from './connection'
import { MongODMEntity, getMongODMPartial } from './entity'
import { MongODMField } from './decorators/field.decorator'
import { ObjectID } from 'mongodb'
import { MongODMRelation } from './decorators/relation.decorator'
import { MongODMIndex } from './decorators/index.decorator'
import {
	MongODMAlreadyInsertedError,
	MongODMCollectionDoesNotExistError,
} from './errors'

const databaseName = 'entitytest'

describe(`MongODM class`, () => {
	describe('find static method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecoratorFind extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}
			0
			let hasError = false

			try {
				await RandomClassWithoutDecoratorFind.find<
					RandomClassWithoutDecoratorFind
				>(connection, { name: 'toto' })
			} catch (error) {
				hasError = true
				expect(error).toBeInstanceOf(MongODMCollectionDoesNotExistError)
			}

			expect(hasError).toEqual(true)
		})

		it('should find all with empty filter', async () => {
			class UserFindAllStatic extends MongODMEntity {
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
			await connection.collections.userfindallstatic.insertOne(
				new UserFindAllStatic('damien@dev.fr')
			)
			await connection.collections.userfindallstatic.insertOne(
				new UserFindAllStatic('jeremy@dev.fr')
			)

			const users = await UserFindAllStatic.find(connection, {})

			expect(users.length()).toEqual(2)
		})

		it('should not find and return emtpy array', async () => {
			class UserFindAllStaticEmpty extends MongODMEntity {
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

			await new UserFindAllStaticEmpty().insert(connection)

			const bads = await UserFindAllStaticEmpty.find(connection, {
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

			class RandomClassWithoutDecoratorFindOne extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecoratorFindOne.findOne<
					RandomClassWithoutDecoratorFindOne
				>(connection, { name: 'toto' })
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratorfindone does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should findOne', async () => {
			class UserFindOneStatic extends MongODMEntity {
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
			await connection.collections.userfindonestatic.insertOne(
				new UserFindOneStatic()
			)

			const user = await UserFindOneStatic.findOne<UserFindOneStatic>(
				connection,
				{
					email: 'damien@marchand.fr',
				}
			)

			expect(user).not.toBe(null)
			expect((user as UserFindOneStatic).email).toEqual('damien@marchand.fr')
		})

		it('should not find and return null', async () => {
			class UserFindOneStaticNull extends MongODMEntity {
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
			await connection.collections.userfindonestaticnull.insertOne(
				new UserFindOneStaticNull()
			)

			const user = await UserFindOneStaticNull.findOne(connection, {
				email: 'donal@trump.usa',
			})

			expect(user).toEqual(null)
		})
	})

	describe(`updateMany static method`, () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecoratorUpdateMany extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecoratorUpdateMany.updateMany<
					RandomClassWithoutDecoratorUpdateMany
				>(connection, { name: 'titi' }, { name: 'toto' })
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratorupdatemany does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should update one element with query filter', async () => {
			class UserUpdateManyOneElement extends MongODMEntity {
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
			await connection.collections.userupdatemanyoneelement.insertMany([
				new UserUpdateManyOneElement('damien@marchand.fr'),
				new UserUpdateManyOneElement('donald@trump.usa'),
			])

			// Update
			await UserUpdateManyOneElement.updateMany<UserUpdateManyOneElement>(
				connection,
				{ email: 'barack@obama.usa' },
				{ email: 'donald@trump.usa' }
			)

			// Search with email
			const trump = await connection.collections.userupdatemanyoneelement.findOne(
				{
					email: 'donald@trump.usa',
				}
			)

			expect(trump).toEqual(null)

			const barack = await connection.collections.userupdatemanyoneelement.findOne(
				{
					email: 'barack@obama.usa',
				}
			)

			expect(barack.email).toEqual('barack@obama.usa')
		})
	})

	describe('deleteMany static method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecoratorDeleteManyStatic extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			try {
				await RandomClassWithoutDecoratorDeleteManyStatic.deleteMany(
					connection,
					{
						name: 'toto',
					}
				)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratordeletemanystatic does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('shoud delete with query filter', async () => {
			class UserDeleteManyQueryFilter extends MongODMEntity {
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
			await connection.collections.userdeletemanyqueryfilter.insertMany([
				new UserDeleteManyQueryFilter('damien@marchand.fr'),
				new UserDeleteManyQueryFilter('donald@trump.usa'),
			])

			// Delete donald
			await UserDeleteManyQueryFilter.deleteMany<UserDeleteManyQueryFilter>(
				connection,
				{
					email: 'donald@trump.usa',
				}
			)

			// Searhc for donald
			const donald = await connection.collections.userdeletemanyqueryfilter.findOne(
				{
					email: 'donald@trump.usa',
				}
			)

			expect(donald).toEqual(null)
		})

		it('should delete all if no query filter', async () => {
			class UserDeleteManyDeleteAll extends MongODMEntity {
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
			await connection.collections.userdeletemanydeleteall.insertMany([
				new UserDeleteManyDeleteAll('damien@marchand.fr'),
				new UserDeleteManyDeleteAll('donald@trump.usa'),
			])

			// Delete all users
			await UserDeleteManyDeleteAll.deleteMany(connection)
			const countUser = await connection.collections.userdeletemanydeleteall.countDocuments()

			expect(countUser).toEqual(0)
		})
	})

	describe('countDocuments static method', () => {
		it('should throw an error if collection does not exist', async () => {
			class RandomClassWithoutDecoratorCountDocumentsStatic extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			let hasError = false

			try {
				await RandomClassWithoutDecoratorCountDocumentsStatic.countDocuments(
					connection,
					{
						name: 'toto',
					}
				)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratorcountdocumentsstatic does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should count all documents', async () => {
			class UserCountAllStatic extends MongODMEntity {
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

			const users: UserCountAllStatic[] = []
			// Add 10 users
			for (let i = 0; i < 10; i++) {
				users.push(new UserCountAllStatic('damien@dev.fr'))
			}
			await connection.collections.usercountallstatic.insertMany(users)

			const count = await UserCountAllStatic.countDocuments(connection)
			expect(count).toEqual(10)
		})

		it('should count documents with query filter', async () => {
			class UserCountDocumentsQueryFilter extends MongODMEntity {
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

			const users: UserCountDocumentsQueryFilter[] = []
			// Add 10 users
			for (let i = 0; i < 10; i++) {
				users.push(new UserCountDocumentsQueryFilter('damien@dev.fr'))
			}
			// User in filter
			users.push(new UserCountDocumentsQueryFilter('jeremy@dev.fr'))

			await connection.collections.usercountdocumentsqueryfilter.insertMany(
				users
			)

			const count = await UserCountDocumentsQueryFilter.countDocuments(
				connection,
				{
					email: 'jeremy@dev.fr',
				}
			)
			expect(count).toEqual(1)
		})
	})

	describe('insert method', () => {
		it('should throw an error if collection does not exist', async () => {
			class RandomClassWithoutDecoratorInsert extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			let hasError = false

			try {
				await new RandomClassWithoutDecoratorInsert().insert(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratorinsert does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should insert', async () => {
			class UserInsert extends MongODMEntity {
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
			const count = await connection.collections.userinsert.countDocuments()
			expect(count).toEqual(0)

			const user = new UserInsert('damien@dev.fr')
			const userId = await user.insert(connection)

			// One user created
			expect(userId).toStrictEqual(user._id as {})

			// Check with id
			const userRetrived = await connection.collections.userinsert.findOne({
				_id: userId,
			})
			expect(userRetrived.email).toEqual(user.email)
		})

		it('should not insert fields without decorator', async () => {
			class UserInsertNoDecoratorFieldSaved extends MongODMEntity {
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

			const obj = new UserInsertNoDecoratorFieldSaved('damien@dev.fr')

			const id = await obj.insert(connection)

			const saved = await connection.collections.userinsertnodecoratorfieldsaved.findOne(
				{
					_id: id,
				}
			)

			expect(saved).toStrictEqual({
				_id: id,
				email: 'damien@dev.fr',
			})
		})

		it('should not insert the same object 2 times', async () => {
			class UserSaved2Times extends MongODMEntity {
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

			const user = new UserSaved2Times()
			const id = await user.insert(connection)

			expect(id).toStrictEqual((user as any)._id)

			let hasError = false
			try {
				await user.insert(connection)
			} catch (error) {
				hasError = true
				expect(error).toBeInstanceOf(MongODMAlreadyInsertedError)
			}
			expect(hasError).toEqual(true)

			const count = await connection.collections.usersaved2times.countDocuments()
			expect(count).toEqual(1)
		})

		it('should trigger beforeInsert', async (done) => {
			class UserBeforeInsert extends MongODMEntity {
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

			const user = new UserBeforeInsert()

			user.events.beforeInsert.subscribe((userToInsert) => {
				expect(userToInsert.firstname).toEqual('Damien')
				expect(userToInsert._id).not.toBeDefined()
				done()
			})

			await user.insert(connection)
		})

		it('should trigger afterInsert', async (done) => {
			class UserAfterInsert extends MongODMEntity {
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

			const user = new UserAfterInsert()

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

	describe('update method', () => {
		it('should throw an error if collection does not exist', async () => {
			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: false,
			})

			class RandomClassWithoutDecoratorUpdate extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			const id = new ObjectID()

			const random = new RandomClassWithoutDecoratorUpdate()
			random._id = id

			try {
				await random.update(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratorupdate does not exist.`
				)
			}
			expect(hasError).toEqual(true)
		})

		it('should update', async () => {
			class UserUpdate extends MongODMEntity {
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

			const user = new UserUpdate('damien@dev.fr')

			// Insert a user with mongo native
			const insertResult = await connection.collections.userupdate.insertOne(
				user
			)

			user._id = insertResult.insertedId

			// Update email
			user.email = 'jeremy@dev.fr'
			await user.update(connection)

			// Find user
			const updated = await connection.collections.userupdate.findOne({
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
			class UserBeforeUpdate extends MongODMEntity {
				@MongODMField()
				firstname: string

				constructor(firstname: string) {
					super()
					this.firstname = firstname
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = await connection.collections.userbeforeupdate.insertOne({
				firstname: 'Damien',
			})
			const id = user.insertedId

			const updateUser = new UserBeforeUpdate('Damien')
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
			class UserAfterUpdate extends MongODMEntity {
				@MongODMField()
				firstname: string

				constructor(firstname: string) {
					super()
					this.firstname = firstname
				}
			}

			const connection = await new MongODMConnection({
				databaseName,
			}).connect({
				clean: true,
			})

			const user = await connection.collections.userafterupdate.insertOne({
				firstname: 'Damien',
			})
			const id = user.insertedId

			const updateUser = new UserAfterUpdate('Damien')
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

			class RandomClassWithoutDecoratorDelete extends MongODMEntity {
				name: string

				constructor() {
					super()
					this.name = 'toto'
				}
			}

			let hasError = false

			const random = new RandomClassWithoutDecoratorDelete()
			const id = new ObjectID()
			random._id = id

			try {
				await random.delete(connection)
			} catch (error) {
				hasError = true
				expect(error.message).toEqual(
					`Collection randomclasswithoutdecoratordelete does not exist.`
				)
				expect(error.code).toEqual('MONGODM_ERROR_404')
			}

			expect(hasError).toEqual(true)
		})

		it('should delete', async () => {
			class UserDelete extends MongODMEntity {
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

			const user = new UserDelete('damien@dev.fr')

			const insertResult = await connection.collections.userdelete.insertOne(
				user
			)
			user._id = insertResult.insertedId

			// Check user in db
			const check = await connection.collections.userdelete.findOne({
				_id: user._id,
			})
			expect(check.email).toEqual(user.email)

			// Delete
			await user.delete(connection)
			const checkDeleted = await connection.collections.userdelete.findOne({
				_id: user._id,
			})
			expect(checkDeleted).toEqual(null)
		})

		it('should trigger beforeDelete', async (done) => {
			class UserBeforeDelete extends MongODMEntity {
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

			const inserted = await connection.collections.userbeforedelete.insertOne({
				email: 'damien@dev.fr',
			})

			const user = new UserBeforeDelete('damien@de.fr')
			user._id = inserted.insertedId

			user.events.beforeDelete.subscribe((userBeforeDelete) => {
				expect(userBeforeDelete._id).toStrictEqual(inserted.insertedId)
				done()
			})

			await user.delete(connection)
		})

		it('should trigger afterDelete', async (done) => {
			class UserAfterDelete extends MongODMEntity {
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

			const inserted = await connection.collections.userafterdelete.insertOne({
				email: 'damien@dev.fr',
			})

			const user = new UserAfterDelete('damien@dev.fr')
			user._id = inserted.insertedId

			user.events.afterDelete.subscribe(async (userDeleted) => {
				expect(userDeleted._id).toStrictEqual(inserted.insertedId)

				// Check if in db
				const checkUser = await connection.collections.userafterdelete.findOne({
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
			class JobPopulateDefaultId extends MongODMEntity {
				@MongODMField()
				name: string

				constructor(name: string) {
					super()
					this.name = name
				}
			}

			class UserPopulateDefaultId extends MongODMEntity {
				@MongODMField()
				firstname: string

				@MongODMRelation({
					populatedKey: 'job',
					targetType: JobPopulateDefaultId,
				})
				jobId: ObjectID
				job?: JobPopulateDefaultId

				@MongODMRelation({
					populatedKey: 'job2',
					targetType: JobPopulateDefaultId,
				})
				jobId2: ObjectID
				job2?: JobPopulateDefaultId

				@MongODMRelation({
					populatedKey: 'jobs',
					targetType: JobPopulateDefaultId,
				})
				jobIds: ObjectID[]
				jobs?: JobPopulateDefaultId[]

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

			const job = new JobPopulateDefaultId('js dev')
			const jobId = await job.insert(connection)

			const job2 = new JobPopulateDefaultId('php dev')
			const job2id = await job2.insert(connection)

			const user = new UserPopulateDefaultId(jobId, job2id)
			await user.insert(connection)

			const userPopulated = await user.populate<UserPopulateDefaultId>(
				connection
			)
			expect(userPopulated.job).toStrictEqual({
				_id: jobId,
				name: 'js dev',
			})
			expect(userPopulated.job2).toStrictEqual({
				_id: job2id,
				name: 'php dev',
			})

			expect((userPopulated.jobs as JobPopulateDefaultId[]).length).toEqual(2)
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

describe('MongODMEntityArray class', () => {
	it('should populate many with _id by default', async () => {
		class JobPopulateManyDefaultId extends MongODMEntity {
			@MongODMIndex({
				unique: true,
			})
			name: string

			constructor(jobName: string) {
				super()
				this.name = jobName
			}
		}

		class UserPopulateManyDefaultId extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateManyDefaultId,
			})
			jobId: ObjectID | null
			job?: JobPopulateManyDefaultId

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateManyDefaultId,
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateManyDefaultId[]

			constructor(jobId: ObjectID) {
				super()
				this.firstname = 'Damien'
				this.jobId = jobId
				this.jobIds = [jobId]
			}

			addJobId(jobId: ObjectID) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert jobs
		const job = new JobPopulateManyDefaultId('Dictator')
		const jobInsertedId = await job.insert(connection)

		const job2 = new JobPopulateManyDefaultId('President')
		const job2InsertedId = await job2.insert(connection)

		// Insert many users
		const usersPromises = []
		for (let i = 0; i < 5; i++) {
			const user = new UserPopulateManyDefaultId(jobInsertedId)
			user.addJobId(job2InsertedId)
			usersPromises.push(user.insert(connection))
		}
		await Promise.all(usersPromises)

		// Get all users
		const users = await UserPopulateManyDefaultId.find(connection, {})
		const populatedUsers = await users.populate<UserPopulateManyDefaultId>(
			connection
		)

		expect(populatedUsers.length).toEqual(5)

		for (const populatedUser of populatedUsers) {
			expect(populatedUser.job).toStrictEqual({
				_id: jobInsertedId,
				name: 'Dictator',
			})
			expect((populatedUser.jobs as JobPopulateManyDefaultId[]).length).toEqual(
				2
			)
			expect(
				(populatedUser.jobs as JobPopulateManyDefaultId[])[0]
			).not.toStrictEqual((populatedUser.jobs as JobPopulateManyDefaultId[])[1])
		}
	})

	it('should populate many with other key for relation', async () => {
		class JobPopulateIdCustomRelationKey extends MongODMEntity {
			@MongODMField()
			name: string

			@MongODMField()
			customId: ObjectID

			constructor(name: string) {
				super()
				this.name = name
				this.customId = new ObjectID()
			}
		}

		class UserPopulateManyCustomRelationKey extends MongODMEntity {
			@MongODMIndex({
				unique: true,
			})
			firstname: string

			@MongODMRelation({
				populatedKey: 'job',
				targetType: JobPopulateIdCustomRelationKey,
				targetKey: 'customId',
			})
			jobId: ObjectID
			job?: JobPopulateIdCustomRelationKey

			@MongODMRelation({
				populatedKey: 'jobs',
				targetType: JobPopulateIdCustomRelationKey,
				targetKey: 'customId',
			})
			jobIds: ObjectID[]
			jobs?: JobPopulateIdCustomRelationKey[]

			constructor(firstname: string, jobId: ObjectID) {
				super()
				this.firstname = firstname
				this.jobId = jobId
				this.jobIds = [jobId]
			}

			addJobId(jobId: ObjectID) {
				this.jobIds.push(jobId)
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const job1 = new JobPopulateIdCustomRelationKey('js dev')
		const job1Id = await job1.insert(connection)

		const job2 = new JobPopulateIdCustomRelationKey('php dev')
		const job2Id = await job2.insert(connection)

		for (let i = 0; i < 5; i++) {
			const user = new UserPopulateManyCustomRelationKey(
				'Damien' + i,
				job1.customId
			)
			user.addJobId(job2.customId)
			await user.insert(connection)
		}

		const users = await UserPopulateManyCustomRelationKey.find(connection, {})
		const populatedUsers = await users.populate<
			UserPopulateManyCustomRelationKey
		>(connection)

		expect(populatedUsers.length).toEqual(5)

		for (const populatedUser of populatedUsers) {
			expect(populatedUser.job).toStrictEqual({
				_id: job1Id,
				name: 'js dev',
				customId: job1.customId,
			})
			expect(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[]).length
			).toEqual(2)
			expect(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[0]
			).not.toStrictEqual(
				(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[1]
			)
		}
	})

	it('should throw an error if try to populate an unknown collection', async () => {
		class UserPopulateUnknownCollection extends MongODMEntity {
			firsname: string = 'Damien'

			constructor() {
				super()
				this._id = new ObjectID()
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserPopulateUnknownCollection()

		let hasError = false
		try {
			await user.populate(connection)
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				'Collection userpopulateunknowncollection does not exist.'
			)
		}

		expect(hasError).toEqual(true)
	})
})

describe('getMongODMPartial function', () => {
	it('should not return field without decorator', () => {
		class UserFull extends MongODMEntity {
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

		const partial = getMongODMPartial(new UserFull(), 'userfull')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
		})
	})

	it('should not return empty field', () => {
		class UserFullEmptyField extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMField()
			age?: number

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const partial = getMongODMPartial(
			new UserFullEmptyField(),
			'userfullemptyfield'
		)

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
