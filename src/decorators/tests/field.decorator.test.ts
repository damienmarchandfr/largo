import { getConnection, LegatoMetaDataStorage, setConnection } from '../..'
import { LegatoConnection } from '../../connection'
import { FieldDecoratorTest } from './Decorator.entity'

describe('LegatoField decorator', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should add field meta to LegatoMetaDataStorage', async () => {
		await new LegatoConnection({
			databaseName: 'fieldDecorator',
		}).connect({
			clean: false,
		})

		FieldDecoratorTest.create<FieldDecoratorTest>({ field: 'test' })

		const classMeta = LegatoMetaDataStorage().LegatoFieldMetas
			.FieldDecoratorTest

		expect(classMeta.length).toEqual(1)
		expect(classMeta[0]).toEqual('field')
	})
})
