import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import axios from 'axios'
import { Category } from '~/types/Category'

const api = axios.create({
  baseURL: '/api',
})

export enum ACTIONS {
  LOAD_CATEGORIES = 'LOAD_CATEGORIES',
  GET_CHILD_CATEGORIES = 'GET_CHILD_CATEGORIES',
  FIND_CATEGORY_BY_PATH = 'FIND_CATEGORY_BY_PATH',
  FIND_CATEGORY_BY_ID = 'FIND_CATEGORY_BY_ID',
}

export enum MUTATIONS {
  SET_CATEGORIES = 'SET_CATEGORIES',
}

const loadCategories = async (store: Store): Promise<Category[]> => {
  if (store.categories.length) {
    return store.categories
  }
  return api.get('/catalog/categories?limit=0').then((response) => {
    const { data } = response
    store.context.commit(MUTATIONS.SET_CATEGORIES, data.items)
    return store.categories
  })
}

export interface RootState {
  categories: Category[]
}

@Module
export default class Store extends VuexModule implements RootState {
  categories: Category[] = [];

  @Mutation
  [MUTATIONS.SET_CATEGORIES](categories: Category[]) {
    this.categories = categories
  }

  @Action
  async [ACTIONS.FIND_CATEGORY_BY_ID](id: number) {
    return loadCategories(this).then((categories) => {
      return categories.find((category) => {
        return category.category_id === id
      })
    })
  }

  @Action
  async [ACTIONS.FIND_CATEGORY_BY_PATH](path: string) {
    const filterByPath: (category: Category) => boolean = (category) => {
      return (
        category.url === path ||
        path.concat('/').substr(0, category.url.length + 1) ===
          category.url.concat('/')
      )
    }

    return loadCategories(this).then((categories) => {
      const matchedCategories = categories.filter(filterByPath)
      if (matchedCategories.length === 0) {
        return null
      }
      return matchedCategories.reduce(((result, currentValue) => {
        return result.url.length < currentValue.url.length
          ? currentValue
          : result
      }) as (result: Category, currentValue: Category) => Category)
    })
  }

  @Action
  async [ACTIONS.GET_CHILD_CATEGORIES](parentId: number | null) {
    const filterByParentId: (category: Category) => boolean = (category) => {
      return category.parent_id === parentId
    }

    return loadCategories(this).then((categories) => {
      return categories.filter(filterByParentId).sort(function (a, b) {
        return a.name.localeCompare(b.name, 'ru-RU')
      })
    })
  }
}
