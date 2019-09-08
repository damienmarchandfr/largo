import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'
import { MongORMIndex } from './index.decorator'

describe('MongORMIndex decorator', () => {
	it('should add index meta to mongORMetaDataStorage', () => {
		class MongORMIndexClass {
			@MongORMIndex({
				unique: true,
			})
			hello: string

			@MongORMIndex({
				unique: false,
			})
			world: string

			constructor() {
				this.hello = 'world'
				this.world = 'hello'
			}
		}

		const classIndexMetas = mongORMetaDataStorage().mongORMIndexMetas[
			generateCollectionName(new MongORMIndexClass())
		]
		expect(classIndexMetas.length).toEqual(2)

		expect(classIndexMetas[0]).toStrictEqual({
			key: 'hello',
			unique: true,
		})

		expect(classIndexMetas[1]).toStrictEqual({
			key: 'world',
			unique: false,
		})
	})
})
