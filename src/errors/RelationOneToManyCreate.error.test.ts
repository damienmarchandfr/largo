import { LegatoErrorRelationOneToManyCreate } from './RelationOneToManyCreate.error'
import { LegatoEntity } from '../entity'
import { ObjectID } from 'mongodb'
import { errorCodes } from '.'

describe('RelationOneToManyCreate error', () => {
	it('should be valid', () => {
		class RelationOneToManyCreateClass extends LegatoEntity {
			relations: ObjectID[]

			constructor() {
				super()
				this.relations = [new ObjectID(), new ObjectID()]
			}
		}

		const obj = new RelationOneToManyCreateClass()

		const error = new LegatoErrorRelationOneToManyCreate(
			obj,
			'relations',
			obj.relations[0]
		)

		console.log(error)
		expect(true).toEqual(true)

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_MANY_CREATE)
		expect(error.type).toEqual('RELATION_ONE_TO_MANY_CREATE')
		expect(error.message).toEqual(
			`You set RelationOneToManyCreateClass.relations : ${obj.relations}. ${obj.relations[0]} does not exist.`
		)
	})
})
