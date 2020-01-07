import { ObjectID } from 'mongodb'
import { LegatoConnection } from '../../connection'
import { ChildEntityArrayTest } from './entities/ChildEntityArray.entity.test'
import { LegatoEntityArray } from '..'
import { NoDecoratorEntityArrayTest } from './entities/NoDecoratorEntityArray.entity.test'
import { LegatoErrorCollectionDoesNotExist } from '../../errors'
import { ParentEntityArrayTest } from './entities/ParentEntityArray.entity.test'
import { getConnection, setConnection } from '../..'

const databaseName = 'entityArrayTest'

describe('LegatoEntityArray class', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should add element to the items list', () => {
		const array = new LegatoEntityArray<ChildEntityArrayTest>()
		expect(array.items.length).toEqual(0)

		array.push(new ChildEntityArrayTest())
		expect(array.items.length).toEqual(1)
	})

	it('should return number of items', () => {
		const array = new LegatoEntityArray<ChildEntityArrayTest>()
		expect(array.length()).toEqual(0)

		array.push(new ChildEntityArrayTest())
		expect(array.length()).toEqual(1)
	})

	it('should throw an error if try to populate an unknown collection', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const array = new LegatoEntityArray()
		const obj = new NoDecoratorEntityArrayTest()
		array.push(obj)

		let hasError = false
		try {
			await array.populate()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('should return empty array if items is empty', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const array = new LegatoEntityArray()
		const populated = await array.populate()
		expect(populated).toStrictEqual([])
	})

	it('should populate with _id by default with one to one relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert children
		const child1 = new ChildEntityArrayTest()
		child1.field = 'child 1'
		const child2 = new ChildEntityArrayTest()
		child2.field = 'child 2'

		await child1.insert()
		await child2.insert()

		// Insert parents
		const parent1 = new ParentEntityArrayTest()
		parent1.field = 'parent 1'
		parent1.childId = child1._id as ObjectID
		await parent1.insert()

		const parent2 = new ParentEntityArrayTest()
		parent2.field = 'parent 2'
		parent2.childId = child2._id as ObjectID
		await parent2.insert()

		// Get all parents
		const parents = await ParentEntityArrayTest.find<ParentEntityArrayTest>()
		const populated = await parents.populate()

		expect(populated.length).toEqual(2)

		console.log(populated)

		const populatedResult = [
			{
				_id: parent1._id,
				field: 'parent 1',
				childId: child1._id,
				child: {
					_id: child1._id,
					field: 'child 1',
					stringId: '',
					numberId: 0,
				},
				childIds: [],
				childIdNoCheck: null,
				childIdsNoCheck: [],
				childIdString: null,
				childIdsString: [],
				childIdNumber: null,
				childIdsNumber: [],
				children: [],
				childrenNoCheck: [],
				childrenString: [],
				childrenNumber: [],
			},
			{
				_id: parent2._id,
				field: 'parent 2',
				childId: child2._id,
				child: {
					_id: child2._id,
					field: 'child 2',
					stringId: '',
					numberId: 0,
				},
				childIds: [],
				childIdNoCheck: null,
				childIdsNoCheck: [],
				childIdString: null,
				childIdsString: [],
				childIdNumber: null,
				childIdsNumber: [],
				children: [],
				childrenNoCheck: [],
				childrenString: [],
				childrenNumber: [],
			},
		]

		populatedResult.forEach((pop) => {
			expect(populated).toContainEqual(pop)
		})
	})

	// it('should populate many with other key for relation', async () => {
	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const job1 = new JobPopulateIdCustomRelationKey('js dev')
	// 	const job1Id = await job1.insert()

	// 	const job2 = new JobPopulateIdCustomRelationKey('php dev')
	// 	await job2.insert()

	// 	for (let i = 0; i < 5; i++) {
	// 		const user = new UserPopulateManyCustomRelationKey(
	// 			'Damien' + i,
	// 			job1.customId
	// 		)
	// 		user.addJobId(job2.customId)
	// 		await user.insert()
	// 	}

	// 	const users = await UserPopulateManyCustomRelationKey.find(connection, {})
	// 	const populatedUsers = await users.populate()

	// 	expect(populatedUsers.length).toEqual(5)

	// 	for (const populatedUser of populatedUsers) {
	// 		expect(populatedUser.job).toStrictEqual({
	// 			_id: job1Id,
	// 			name: 'js dev',
	// 			customId: job1.customId,
	// 		})
	// 		expect(
	// 			(populatedUser.jobs as JobPopulateIdCustomRelationKey[]).length
	// 		).toEqual(2)
	// 		expect(
	// 			(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[0]
	// 		).not.toStrictEqual(
	// 			(populatedUser.jobs as JobPopulateIdCustomRelationKey[])[1]
	// 		)
	// 	}
	// })
})
