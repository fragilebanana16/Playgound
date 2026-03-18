import { ref, watchEffect, onUnmounted, type Ref } from 'vue';

interface IntersectionOptions {
    threshold?: number | number[];
    root?: Element | Document | null;
    rootMargin?: string;
    pageSize: number;
    initialPageNum?: number;
}

type Callback = (pageNum: number, pageSize: number) => void;

/**
 * 规范化的交叉观察器 Hook
 * @param elementRef - 可以是单个元素 Ref，也可以是 v-for 绑定产生的元素数组 Ref
 * @param options - 包含分页逻辑和原生 Observer 的配置
 * @param callback - 触底时的回调函数
 */
export function useIntersectionObserver<T extends Element>(
    elementRef: Ref<T | T[] | null>,
    options: IntersectionOptions,
    callback: Callback,
) {
    const {
        threshold = 0.1,
        root = null,
        rootMargin = "0px",
        pageSize,
        initialPageNum = 1,
    } = options;

    const pageNum = ref<number>(initialPageNum);
    
    // 使用 Map 记录是否为最后一个元素
    const isLastElementMap = new WeakMap<Element, boolean>();

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const isLast = isLastElementMap.get(element);

                    if (isLast) {
                        callback(pageNum.value, pageSize);
                        pageNum.value++;
                        // 触发后停止观察该元素，避免重复触发
                        observer.unobserve(element);
                    }
                }
            });
        },
        { threshold, root, rootMargin }
    );

    watchEffect(() => {
        // 清理旧的观察状态
        observer.disconnect();

        const val = elementRef.value;
        if (!val) return;

        const elements = Array.isArray(val) ? val : [val];
        
        elements.forEach((el, index) => {
            if (el instanceof Element) {
                const isLast = index === elements.length - 1;
                isLastElementMap.set(el, isLast);
                observer.observe(el);
            }
        });
    });

    onUnmounted(() => {
        observer.disconnect();
    });

    return {
        pageNum
    };
}