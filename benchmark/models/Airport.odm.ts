import { MongODMEntity } from '../../src/entity'
import { MongODMField } from '../../src/decorators/field.decorator'
import { MongODMRelation } from '../../src/decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { Airport } from '../data'
import { UserODM } from './User.odm'

export class AirportODM extends MongODMEntity {
	@MongODMField()
	city: string

	@MongODMRelation({
		populatedKey: 'employees',
		targetType: UserODM,
	})
	employeesIds: ObjectID[] = []
	employees?: UserODM[]

	@MongODMRelation({
		populatedKey: 'clients',
		targetType: UserODM,
	})
	clientsIds: ObjectID[] = []
	clients?: UserODM[]

	@MongODMRelation({
		populatedKey: 'boss',
		targetType: UserODM,
	})
	bossId: ObjectID | null = null
	boss?: UserODM

	constructor() {
		super()
		const airport = new Airport()
		this.city = airport.city
	}
}
