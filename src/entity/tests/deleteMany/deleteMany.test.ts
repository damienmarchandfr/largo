import { LegatoConnection } from '../../../connection'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import {
	DeleteManyEntityTest,
	DeleteManyEntityTestNoDecorator,
} from './entities/DeleteMany.entity.test'
import { getConnection, setConnection } from '../../..'
import { DeleteManyChildTest } from './entities/DeleteManyChild.entity.test'
import { DeleteManyParentTest } from './entities/DeleteManyParent.entity.test'
import { ObjectID } from 'mongodb'
import { LegatoErrorDeleteChild } from '../../../errors/delete/DeleteChild.error'

const databaseName = 'deleteMany'

describe('static method deleteMany', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw an error if collection does not exist', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		try {
			await DeleteManyEntityTestNoDecorator.deleteMany({
				name: 'john',
			})
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot find DeleteManyEntityTestNoDecorator collection.`
			)
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('shoud delete with query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Add 2 users
		await connection.collections.DeleteManyEntityTest.insertMany([
			new DeleteManyEntityTest('john@doe.fr'),
			new DeleteManyEntityTest('donald@trump.usa'),
		])

		// Delete donald
		await DeleteManyEntityTest.deleteMany<DeleteManyEntityTest>({
			email: 'donald@trump.usa',
		})

		// Search for Donald
		const donald = await connection.collections.DeleteManyEntityTest.findOne({
			email: 'donald@trump.usa',
		})

		expect(donald).toEqual(null)
	})

	it('should delete all if no query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Add 2 users
		await connection.collections.DeleteManyEntityTest.insertMany([
			new DeleteManyEntityTest('john@doe.fr'),
			new DeleteManyEntityTest('donald@trump.usa'),
		])

		// Delete all users
		await DeleteManyEntityTest.deleteMany()
		const countUser = await connection.collections.DeleteManyEntityTest.countDocuments()

		expect(countUser).toEqual(0)
	})

	it('should not throw error if delete child with parent.relation check = false for one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create one child
		const child = await new DeleteManyChildTest()
		await connection.collections.DeleteManyChildTest.insertOne(child)

		// Create parents with one to one relation
		const promises = []
		for (let i = 0; i < 3; i++) {
			const parent = new DeleteManyParentTest()
			// Link parent to child
			parent.childIdNoCheck = child._id as ObjectID
			promises.push(
				connection.collections.DeleteManyParentTest.insertOne(parent)
			)
		}
		// Save parents
		await Promise.all(promises)

		// Get parents saved
		const parentsFromMongo = await connection.collections.DeleteManyParentTest.find().toArray()
		expect(parentsFromMongo.length).toEqual(3)
		expect(parentsFromMongo[0].childIdNoCheck).toStrictEqual(child._id)

		// Try delete child
		let hasError = false
		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			hasError = true
		}
		expect(hasError).toBeFalsy()

		const childrenCount = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCount).toEqual(0)

		// Parent has a relation with no child
		const parentWithMissingChild = await connection.collections.DeleteManyParentTest.find(
			{}
		).toArray()
		expect(parentWithMissingChild.length).toEqual(3)

		// Every parent has a broken relation
		for (const parent of parentWithMissingChild) {
			expect(parent.childIdNoCheck).not.toBeNull()
			expect(parent.childIdNoCheck).toBeInstanceOf(ObjectID)
		}

		const childId = parentWithMissingChild[0].childIdNoCheck

		// Search child
		const notFound = await connection.collections.DeleteManyChildTest.findOne({
			_id: childId,
		})
		expect(notFound).toBeNull()
	})

	it('should not throw error if delete children with parent.relation check = false for one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Childrens
		const child1 = new DeleteManyChildTest()
		const child2 = new DeleteManyChildTest()
		const child3 = new DeleteManyChildTest()

		// Save childrens
		await connection.collections.DeleteManyChildTest.insertOne(child1)
		await connection.collections.DeleteManyChildTest.insertOne(child2)
		await connection.collections.DeleteManyChildTest.insertOne(child3)

		// Create parent
		const parent = new DeleteManyParentTest()

		parent.childIdsNoCheck = [child1._id as ObjectID, child2._id as ObjectID]

		// Save parent
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Delete all childrens
		let hasError = false
		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// No child in database
		const childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(0)

		// Parent have broken relations
		const brokenParent = await connection.collections.DeleteManyParentTest.find(
			{}
		).toArray()

		expect(brokenParent.length).toEqual(1)
		expect(brokenParent[0].childIdsNoCheck).toStrictEqual(
			parent.childIdsNoCheck
		)
	})

	it('should throw error if want to delete a child in one to one with check = true', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create parent
		const parent = new DeleteManyParentTest()

		// Create child
		const child = new DeleteManyChildTest()
		// Save child
		await connection.collections.DeleteManyChildTest.insertOne(child)

		parent.childId = child._id as ObjectID

		// Save parent
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Try to delete child
		let hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			// TODO : check error content
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		// Child is not deleted
		const childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(1)
	})

	it('should throw error with one to many relation with checkRelation = true', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create parent
		const parent = new DeleteManyParentTest()

		// Create two children
		const child1 = new DeleteManyChildTest()
		const child2 = new DeleteManyChildTest()

		// Save children
		await connection.collections.DeleteManyChildTest.insertMany([
			child1,
			child2,
		])

		expect(true).toBeTruthy()
		// Save parent
		parent.childIds = [child1._id as ObjectID, child2._id as ObjectID]
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Try to delete one child
		let hasError = false
		try {
			await DeleteManyChildTest.deleteMany({ _id: child1._id })
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
			hasError = true
		}

		expect(hasError).toBeTruthy()

		// Check child is not delted
		let childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(2)

		// Try to delete all children
		hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		// Check no children deleted
		childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(2)
	})

	it('should throw error if want to delete a child in one to one with check = true and custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// id as string

		// Create parent
		const parent = new DeleteManyParentTest()
		parent.childIdString = 'john'

		// Create child
		const child = new DeleteManyChildTest()
		child.stringId = 'john'

		// Save child
		await connection.collections.DeleteManyChildTest.insertOne(child)

		// Save parent
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Try to delete child
		let hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			expect(error.childRelationKey).toEqual('stringId')
			expect(error.childRelationKeyValue).toEqual('john')
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		// Child is not deleted
		let childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(1)

		// id as number
		await connection.collections.DeleteManyChildTest.deleteMany({})
		await connection.collections.DeleteManyParentTest.deleteMany({})

		const parent2 = new DeleteManyParentTest()
		parent2.childIdNumber = 1

		const child2 = new DeleteManyChildTest()
		child2.numberId = 1

		await connection.collections.DeleteManyChildTest.insertOne(child2)
		await connection.collections.DeleteManyParentTest.insertOne(parent2)

		hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			expect(error.childRelationKey).toEqual('numberId')
			expect(error.childRelationKeyValue).toEqual(1)
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(1)
	})

	it('should throw error if want to delete a child in one to many with check = true and custom id', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// id as string

		// Create parent
		const parent = new DeleteManyParentTest()
		parent.childIdsString = ['john']

		// Create child
		const child = new DeleteManyChildTest()
		child.stringId = 'john'

		// Save child
		await connection.collections.DeleteManyChildTest.insertOne(child)

		// Save parent
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Try to delete child
		let hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			expect(error.childRelationKey).toEqual('stringId')
			expect(error.childRelationKeyValue).toEqual('john')
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		// Child is not deleted
		let childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(1)

		// id as number
		await connection.collections.DeleteManyChildTest.deleteMany({})
		await connection.collections.DeleteManyParentTest.deleteMany({})

		const parent2 = new DeleteManyParentTest()
		parent2.childIdsNumber = [1]

		const child2 = new DeleteManyChildTest()
		child2.numberId = 1

		await connection.collections.DeleteManyChildTest.insertOne(child2)
		await connection.collections.DeleteManyParentTest.insertOne(parent2)

		hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			expect(error.childRelationKey).toEqual('numberId')
			expect(error.childRelationKeyValue).toEqual(1)
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorDeleteChild)
		}

		expect(hasError).toBeTruthy()

		childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(1)
	})

	it('should delete if parent relation is set to null for one to one relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create parent
		const parent = new DeleteManyParentTest()

		// Create child
		const child = new DeleteManyChildTest()

		// Save child
		await connection.collections.DeleteManyChildTest.insertOne(child)

		// Save parent
		parent.childId = null
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		// Delete child
		let hasError = false
		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// Check child is deleted
		const childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()
		expect(childrenCounter).toEqual(0)
	})

	it('should delete if parent relation is set to [] for one to many relation', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Create parent
		const parent = new DeleteManyParentTest()

		// Create children
		const child1 = new DeleteManyChildTest()
		const child2 = new DeleteManyChildTest()

		// Save children
		await connection.collections.DeleteManyChildTest.insertMany([
			child1,
			child2,
		])

		// Save parent
		parent.childIds = []
		await connection.collections.DeleteManyParentTest.insertOne(parent)

		let hasError = false

		try {
			await DeleteManyChildTest.deleteMany()
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBeFalsy()

		// Children must be deleted
		const childrenCounter = await connection.collections.DeleteManyChildTest.countDocuments()

		expect(childrenCounter).toEqual(0)
	})
})
