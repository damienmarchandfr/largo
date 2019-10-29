import { LegatoConnection } from '../../../connection'
import { LegatoEntity } from '../..'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../../decorators/field.decorator'
import { LegatoRelation } from '../../../decorators/relation.decorator'
import { exec } from 'child_process'
import { getConnection, setConnection } from '../../..'
import {
	DeleteEntityTestWithoutDecorator,
	DeleteEntityTest,
} from './entities/Delete.entity.test'
import { async } from 'rxjs/internal/scheduler/async'
import { DeleteChildTest } from './entities/DeleteChild.entity.test'
import { DeleteParentTest } from './entities/DeleteParent.entity.test'
import { DeleteNoChildTest } from './entities/DeleteNoChild.entity.test'
import { ParentEntityTest } from '../index/enities/Parent.entity.test'

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

	// 	let hasError = false

	// 	const toDelete = new DeleteEntityTestWithoutDecorator()
	// 	const id = new ObjectID()
	// 	toDelete._id = id

	// 	try {
	// 		await toDelete.delete()
	// 	} catch (error) {
	// 		hasError = true
	// 		expect(error.message).toEqual(
	// 			`Cannot find DeleteEntityTestWithoutDecorator collection.`
	// 		)
	// 	}

	// 	expect(hasError).toBeTruthy()
	// })

	// it('should throw error if object does not have _id', async () => {
	// 	await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: false,
	// 	})

	// 	let hasError = false

	// 	// No _id set
	// 	const toDelete = new DeleteEntityTest('John')
	// 	try {
	// 		await toDelete.delete()
	// 	} catch (error) {
	// 		hasError = true
	// 		expect(error.message).toEqual(
	// 			`Cannot delete DeleteEntityTest. No mongoID set.`
	// 		)
	// 	}

	// 	expect(hasError).toBeTruthy()
	// })

	// it('should delete', async () => {
	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const obj = new DeleteEntityTest('john')

	// 	// Insert with native
	// 	const insertResult = await connection.collections.DeleteEntityTest.insertOne(
	// 		obj
	// 	)
	// 	obj._id = insertResult.insertedId

	// 	// Check user in db
	// 	const check = await connection.collections.DeleteEntityTest.findOne({
	// 		_id: obj._id,
	// 	})
	// 	expect(check.name).toEqual(obj.name)

	// 	// Delete
	// 	await obj.delete()
	// 	const checkDeleted = await connection.collections.DeleteEntityTest.findOne({
	// 		_id: obj._id,
	// 	})
	// 	expect(checkDeleted).toBeNull()
	// })

	// it('should trigger beforeDelete', async (done) => {
	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const obj = new DeleteEntityTest('john')
	// 	const inserted = await connection.collections.DeleteEntityTest.insertOne(
	// 		obj
	// 	)

	// 	obj._id = inserted.insertedId

	// 	obj.beforeDelete<DeleteEntityTest>().subscribe((objBeforeDelete) => {
	// 		expect(objBeforeDelete._id).toStrictEqual(inserted.insertedId)
	// 		done()
	// 	})

	// 	await obj.delete()
	// })

	// it('should trigger afterDelete', async (done) => {
	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const obj = new DeleteEntityTest('john')

	// 	const inserted = await connection.collections.DeleteEntityTest.insertOne(
	// 		obj
	// 	)
	// 	obj._id = inserted.insertedId

	// 	obj.afterDelete<DeleteEntityTest>().subscribe(async (objDeleted) => {
	// 		expect(objDeleted._id).toStrictEqual(inserted.insertedId)
	// 		expect(objDeleted.name).toEqual('john')

	// 		// Check if in db
	// 		const check = await connection.collections.DeleteEntityTest.findOne({
	// 			_id: inserted.insertedId,
	// 		})

	// 		expect(check).toEqual(null)

	// 		done()
	// 	})

	// 	await obj.delete()
	// })

	it('should be forbidden to delete an object with a one to one child relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new DeleteParentTest()
		await parent.insert()

		const child = new DeleteChildTest()
		const childId = await child.insert()

		parent.childId = childId
		parent.childIds = [childId, childId]

		await parent.update()

		let hasError = false

		try {
			await child.delete()
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
