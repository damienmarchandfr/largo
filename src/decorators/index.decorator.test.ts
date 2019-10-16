import { LegatoMetaDataStorage } from '..'
import { LegatoIndex } from './index.decorator'
import { LegatoConnection } from '../connection'
import { LegatoEntity } from '../entity'

const databaseName = 'indexDecorator'

describe('LegatoIndex decorator', () => {
	it('should add index meta to LegatoMetaDataStorage', () => {
		class LegatoIndexClass extends LegatoEntity {
			@LegatoIndex({
				unique: true,
			})
			hello: string

			@LegatoIndex({
				unique: false,
			})
			world: string

			constructor() {
				super()
				this.hello = 'world'
				this.world = 'hello'
			}
		}

		const classIndexMetas = LegatoMetaDataStorage().LegatoIndexMetas
			.legatoindexclasses
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

	it('should create a unique index', async () => {
		class UniqueIndex extends LegatoEntity {
			@LegatoIndex({
				unique: true,
			})
			id: string

			constructor() {
				super()
				this.id = 'hello'
			}
		}

		const connexion = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		console.log(connexion.collections)

		// No error for the first object saved with id = hello
		await connexion.collections.uniqueindices.insertOne(new UniqueIndex())

		let hasError = false

		try {
			await connexion.collections.uniqueindices.insertOne(new UniqueIndex())
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBe(true)

		// Check if just one inserted
		const count = await connexion.collections.uniqueindexes.count({
			id: 'hello',
		})

		expect(count).toEqual(1)
	})
})
