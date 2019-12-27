import { LegatoField } from '../field.decorator'
import { LegatoMetaDataStorage } from '../..'
import { LegatoEntity } from '../../entity'

describe('LegatoField decorator', () => {
	it('should add field meta to LegatoMetaDataStorage', () => {
		const classMeta = LegatoMetaDataStorage().LegatoFieldMetas
			.FieldDocoratorTest
		expect(classMeta.length).toEqual(1)
		expect(classMeta[0]).toEqual('field')
	})
})
