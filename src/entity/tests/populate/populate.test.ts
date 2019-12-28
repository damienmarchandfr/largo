import { ObjectID } from 'mongodb'
import { LegatoConnection } from '../../../connection'
import { getConnection, setConnection } from '../../..'
import { PopulateParentTest } from './entities/PopulateParent.entity.test'
import { PopulateChildTest } from './entities/PopulateChild.entity.test'

const databaseName = 'populateTest'

describe('populate method', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should populate with _id by default in one to one relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child = new PopulateChildTest()
		await child.insert()
		parent.childId = child._id as ObjectID
		await parent.insert()

		const populated = await parent.populate()
		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: child._id,
			childIds: [],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdString: null,
			childIdsString: [],
			childIdNumber: null,
			childIdsNumber: [],
			child: { _id: child._id, field: 'child', stringId: '', numberId: 0 },
			children: [],
			childrenNoCheck: [],
			childrenString: [],
			childrenNumber: [],
		})
	})

	it('should populate with _id by default in one to many relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child1 = new PopulateChildTest()
		await child1.insert()
		const child2 = new PopulateChildTest()
		await child2.insert()
		parent.childIds = [child1._id, child2._id] as ObjectID[]
		await parent.insert()

		const populated = await parent.populate()

		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: null,
			childIds: [child1._id, child2._id],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdString: null,
			childIdsString: [],
			childIdNumber: null,
			childIdsNumber: [],
			children: [
				{ _id: child1._id, field: 'child', stringId: '', numberId: 0 },
				{ _id: child2._id, field: 'child', stringId: '', numberId: 0 },
			],
			childrenNoCheck: [],
			childrenString: [],
			childrenNumber: [],
		})
	})

	it('should populate with id as string in one to one relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child = new PopulateChildTest()
		child.stringId = 'id'
		await child.insert()
		parent.childIdString = 'id'
		await parent.insert()

		const populated = await parent.populate()

		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: null,
			childIds: [],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdString: 'id',
			childIdsString: [],
			childIdNumber: null,
			childIdsNumber: [],
			childString: {
				_id: child._id,
				field: 'child',
				stringId: 'id',
				numberId: 0,
			},
			children: [],
			childrenNoCheck: [],
			childrenString: [],
			childrenNumber: [],
		})
	})

	it('should populate with id as string in one to many relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child1 = new PopulateChildTest()
		child1.stringId = 'id1'

		await child1.insert()
		const child2 = new PopulateChildTest()
		child2.stringId = 'id2'
		await child2.insert()
		parent.childIdsString = ['id1', 'id2']
		await parent.insert()

		const populated = await parent.populate()

		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: null,
			childIds: [],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdString: null,
			childIdsString: ['id1', 'id2'],
			childIdNumber: null,
			childIdsNumber: [],
			children: [],
			childrenNoCheck: [],
			childrenString: [
				{ _id: child1._id, field: 'child', stringId: 'id1', numberId: 0 },
				{ _id: child2._id, field: 'child', stringId: 'id2', numberId: 0 },
			],
			childrenNumber: [],
		})
	})

	it('should populate with id as number in one to one relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child = new PopulateChildTest()
		child.numberId = 1
		await child.insert()
		parent.childIdNumber = 1
		await parent.insert()

		const populated = await parent.populate()

		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: null,
			childIds: [],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdsString: [],
			childIdString: null,
			childIdNumber: 1,
			childNumber: {
				_id: child._id,
				field: 'child',
				stringId: '',
				numberId: 1,
			},
			childIdsNumber: [],
			children: [],
			childrenNoCheck: [],
			childrenString: [],
			childrenNumber: [],
		})
	})

	it('should populate with id as string in one to many relation', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const parent = new PopulateParentTest()
		const child1 = new PopulateChildTest()
		child1.numberId = 1

		await child1.insert()
		const child2 = new PopulateChildTest()
		child2.numberId = 2
		await child2.insert()
		parent.childIdsNumber = [1, 2]
		await parent.insert()

		const populated = await parent.populate()

		expect(populated).toStrictEqual({
			_id: parent._id,
			field: 'parent',
			childId: null,
			childIds: [],
			childIdNoCheck: null,
			childIdsNoCheck: [],
			childIdString: null,
			childIdsString: [],
			childIdNumber: null,
			childIdsNumber: [1, 2],
			children: [],
			childrenNoCheck: [],
			childrenString: [],
			childrenNumber: [
				{ _id: child1._id, field: 'child', stringId: '', numberId: 1 },
				{ _id: child2._id, field: 'child', stringId: '', numberId: 2 },
			],
		})
	})
})
