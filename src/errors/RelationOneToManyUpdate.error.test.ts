import { LegatoErrorRelationOneToManyUpdate } from './RelationOneToManyUpdate.error'
import { LegatoEntity } from '../entity'
import { ObjectID } from 'mongodb'
import { errorCodes } from '.'

describe('RelationOneToManyUpdate error', () => {
	it('should be valid', () => {
		class RelationOneToManyUpdateClass extends LegatoEntity {
			relations: ObjectID[]

			constructor() {
				super()
				this._id = new ObjectID()
				this.relations = [new ObjectID(), new ObjectID()]
			}
		}

		const obj = new RelationOneToManyUpdateClass()

		const error = new LegatoErrorRelationOneToManyUpdate(
			obj,
			'relations',
			obj.relations[0]
		)

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_MANY_UPDATE)
		expect(error.type).toEqual('RELATION_ONE_TO_MANY_UPDATE')
		expect(error.message).toEqual(
			`You set RelationOneToManyUpdateClass.relations : ${obj.relations} for object with _id : ${obj._id}.${obj.relations[0]} does not exist.`
		)
	})
})
