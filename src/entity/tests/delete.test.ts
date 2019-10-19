import { LegatoConnection } from '../../connection'
import { LegatoEntity } from '..'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../decorators/field.decorator'
import { LegatoRelation } from '../../decorators/relation.decorator'
import { exec } from 'child_process'
import { getConnection, setConnection } from '../..'

const databaseName = 'deleteTest'

describe('delete method', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	// it('should throw an error if collection does not exist', async () => {
	// 	await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: false,
	// 	})

	// 	class RandomClassWithoutDecoratorDelete extends LegatoEntity {
	// 		name: string

	// 		constructor() {
	// 			super()
	// 			this.name = 'John'
	// 		}
	// 	}

	// 	let hasError = false

	// 	const random = new RandomClassWithoutDecoratorDelete()
	// 	const id = new ObjectID()
	// 	random._id = id

	// 	try {
	// 		await random.delete()
	// 	} catch (error) {
	// 		hasError = true
	// 		expect(error.message).toEqual(
	// 			`Collection RandomClassWithoutDecoratorDelete does not exist.`
	// 		)
	// 	}

	// 	expect(hasError).toBeTruthy()
	// })

	// it('should delete', async () => {
	// 	class UserDelete extends LegatoEntity {
	// 		@LegatoField()
	// 		email: string

	// 		constructor(email: string) {
	// 			super()
	// 			this.email = email
	// 		}
	// 	}

	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const user = new UserDelete('damien@dev.fr')

	// 	// Insert with native
	// 	const insertResult = await connection.collections.UserDelete.insertOne(user)
	// 	user._id = insertResult.insertedId

	// 	// Check user in db
	// 	const check = await connection.collections.UserDelete.findOne({
	// 		_id: user._id,
	// 	})
	// 	expect(check.email).toEqual(user.email)

	// 	// Delete
	// 	await user.delete()
	// 	const checkDeleted = await connection.collections.UserDelete.findOne({
	// 		_id: user._id,
	// 	})
	// 	expect(checkDeleted).toBeNull()
	// })

	// it('should trigger beforeDelete', async (done) => {
	// 	class UserBeforeDelete extends LegatoEntity {
	// 		@LegatoField()
	// 		email: string

	// 		constructor(email: string) {
	// 			super()
	// 			this.email = email
	// 		}
	// 	}

	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const inserted = await connection.collections.UserBeforeDelete.insertOne({
	// 		email: 'damien@dev.fr',
	// 	})

	// 	const user = new UserBeforeDelete('damien@dev.fr')
	// 	user._id = inserted.insertedId

	// 	user.beforeDelete<UserBeforeDelete>().subscribe((userBeforeDelete) => {
	// 		expect(userBeforeDelete._id).toStrictEqual(inserted.insertedId)
	// 		done()
	// 	})

	// 	await user.delete()
	// })

	// it('should trigger afterDelete', async (done) => {
	// 	class UserAfterDelete extends LegatoEntity {
	// 		@LegatoField()
	// 		email: string

	// 		constructor(email: string) {
	// 			super()
	// 			this.email = email
	// 		}
	// 	}

	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const inserted = await connection.collections.UserAfterDelete.insertOne({
	// 		email: 'damien@dev.fr',
	// 	})

	// 	const user = new UserAfterDelete('damien@dev.fr')
	// 	user._id = inserted.insertedId

	// 	user.afterDelete<UserAfterDelete>().subscribe(async (userDeleted) => {
	// 		expect(userDeleted._id).toStrictEqual(inserted.insertedId)

	// 		// Check if in db
	// 		const checkUser = await connection.collections.UserAfterDelete.findOne({
	// 			_id: inserted.insertedId,
	// 		})

	// 		expect(checkUser).toEqual(null)

	// 		done()
	// 	})

	// 	await user.delete()
	// })

	it('should be forbidden to delete an object with a one to one child relation', async () => {
		class JobDeleteWithRelation extends LegatoEntity {
			@LegatoField()
			name: string

			constructor(name: string) {
				super()
				this.name = name
			}
		}

		class UserDeleteWithRelation extends LegatoEntity {
			@LegatoRelation({
				populatedKey: 'job',
				targetType: JobDeleteWithRelation,
			})
			jobId: ObjectID

			constructor(jId: ObjectID) {
				super()
				this.jobId = jId
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create job
		const job = new JobDeleteWithRelation('js dev')
		const insertedJob = await connection.collections.JobDeleteWithRelation.insertOne(
			job
		)

		// Inset a user linked to a job
		const user = new UserDeleteWithRelation(insertedJob.insertedId)
		const insertedUser = await connection.collections.UserDeleteWithRelation.insertOne(
			user
		)
		user._id = insertedUser.insertedId

		let hasError = false

		try {
			await user.delete()
		} catch (error) {
			console.error(error)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		// // Check user not deleted
		// const userNotDeleted = await connection.collections.UserDeleteWithRelation.findOne(
		// 	{ _id: userId }
		// )

		// expect(userNotDeleted._id).toStrictEqual(userId)
	})

	// it('should accept delete object with relation if element is deleted before', async () => {
	// 	class JobDeleteWithRelation extends LegatoEntity {
	// 		@LegatoField()
	// 		name: string

	// 		constructor(name: string) {
	// 			super()
	// 			this.name = name
	// 		}
	// 	}

	// 	class UserDeleteWithRelation extends LegatoEntity {
	// 		@LegatoRelation({
	// 			populatedKey: 'job',
	// 			targetType: JobDeleteWithRelation,
	// 		})
	// 		jobId: ObjectID

	// 		constructor(jId: ObjectID) {
	// 			super()
	// 			this.jobId = jId
	// 		}
	// 	}

	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	// Create job
	// 	const job = new JobDeleteWithRelation('js dev')
	// 	const jobId = await job.insert()

	// 	// Inset a user linked to a job
	// 	const user = new UserDeleteWithRelation(jobId)
	// 	const userId = await user.insert()

	// 	// Delete job
	// 	await job.delete()

	// 	let hasError = false

	// 	try {
	// 		await user.delete()
	// 	} catch (error) {
	// 		hasError = true
	// 	}

	// 	expect(hasError).toEqual(false)

	// 	// Check user not deleted
	// 	const userNotDeleted = await connection.collections.UserDeleteWithRelation.findOne(
	// 		{ _id: userId }
	// 	)

	// 	expect(userNotDeleted._id).toStrictEqual(userId)
	// })
})
