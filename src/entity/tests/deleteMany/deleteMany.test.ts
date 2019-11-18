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
import { clone } from '@babel/types'

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
			console.log(parent)
			expect(parent.childIdNoCheck).toBeInstanceOf(ObjectID)
		}

		const childId = parentWithMissingChild[0].childIdNoCheck

		// Search child
		const notFound = await connection.collections.DeleteManyChildTest.findOne({
			_id: childId,
		})
		expect(notFound).toBeNull()

		// // One to many
		// for (let i = 0; i < 3; i++) {
		// 	const parent = new DeleteManyParentTest()
		// 	parent.childIdsNoCheck = [child._id, child._id] as ObjectID[]
		// 	promises.push(
		// 		connection.collections.DeleteManyParentTest.insertOne(parent)
		// 	)
		// }

		// // Save parents
		// await Promise.all(promises)

		// // Get parents saved
		// parentsFromMongo = await connection.collections.DeleteManyParentTest.find().toArray()
		// expect(parentsFromMongo.length).toEqual(3)
		// expect(parentsFromMongo[0].childIdsNoCheck).toStrictEqual([
		// 	child._id,
		// 	child._id,
		// ])

		// // Try delete parents
		// hasError = false
		// try {
		// 	await DeleteManyParentTest.deleteMany()
		// } catch (error) {
		// 	hasError = true
		// }

		// expect(hasError).toBeFalsy()

		// // Cound parents
		// parentsFromMongo = await connection.collections.DeleteManyParentTest.find().toArray()
		// expect(parentsFromMongo.length).toEqual(0)
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

		// Create parents
		const parent1 = new DeleteManyParentTest()
		const parent2 = new DeleteManyParentTest()

		parent1.childIdsNoCheck = [child1._id as ObjectID, child2._id as ObjectID]
		parent2.childIdsNoCheck = [child2._id as ObjectID, child3._id as ObjectID]

		// Save parents
		await connection.collections.DeleteManyParentTest.insertOne(parent1)
		await connection.collections.DeleteManyParentTest.insertOne(parent2)
	})
})
