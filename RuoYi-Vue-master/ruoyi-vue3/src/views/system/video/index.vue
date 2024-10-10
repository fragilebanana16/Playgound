<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="封面地址" prop="thumbnailUrl">
        <el-input
          v-model="queryParams.thumbnailUrl"
          placeholder="请输入封面地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="观看次数" prop="views">
        <el-input
          v-model="queryParams.views"
          placeholder="请输入观看次数"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="地址" prop="url">
        <el-input
          v-model="queryParams.url"
          placeholder="请输入地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="影视目录" prop="categoryId">
        <el-input
          v-model="queryParams.categoryId"
          placeholder="请输入影视目录"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重新查询</el-button>
        <el-button type="danger" @click="resetDB">重置数据库</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:video:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:video:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:video:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:video:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="videoList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户ID" align="center" prop="videoId" />
      <el-table-column label="标题" align="center" prop="title" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="封面地址" align="center" prop="thumbnailUrl" />
      <el-table-column label="观看次数" align="center" prop="views" />
      <el-table-column label="地址" align="center" prop="url" />
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="影视目录" align="center" prop="categoryId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:video:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:video:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改影视对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="videoRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="封面地址" prop="thumbnailUrl">
          <el-input v-model="form.thumbnailUrl" placeholder="请输入封面地址" />
        </el-form-item>
        <el-form-item label="观看次数" prop="views">
          <el-input v-model="form.views" placeholder="请输入观看次数" />
        </el-form-item>
        <el-form-item label="地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="影视目录" prop="categoryId">
          <el-input v-model="form.categoryId" placeholder="请输入影视目录" />
        </el-form-item>
        <el-divider content-position="center">影视目录信息</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="Plus" @click="handleAddSysVideoCategory">添加</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" icon="Delete" @click="handleDeleteSysVideoCategory">删除</el-button>
          </el-col>
        </el-row>
        <el-table :data="sysVideoCategoryList" :row-class-name="rowSysVideoCategoryIndex" @selection-change="handleSysVideoCategorySelectionChange" ref="sysVideoCategory">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="$comment" prop="categoryName" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.categoryName" placeholder="请输入$comment" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Video">
import { resetToLocalMovies, listVideo, getVideo, delVideo, addVideo, updateVideo } from "@/api/system/video";
const { proxy } = getCurrentInstance();

const videoList = ref([]);
const sysVideoCategoryList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const checkedSysVideoCategory = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    description: null,
    thumbnailUrl: null,
    views: null,
    url: null,
    status: null,
    categoryId: null
  },
  rules: {
    title: [
      { required: true, message: "标题不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "地址不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

function resetDB(){
  loading.value = true;
  resetToLocalMovies(queryParams.value).then(response => {
    debugger
    proxy.$modal.msgSuccess(`重置${response}个电影`);
    loading.value = false;
  });
}

/** 查询影视列表 */
function getList() {
  loading.value = true;
  listVideo(queryParams.value).then(response => {
    videoList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    videoId: null,
    title: null,
    description: null,
    thumbnailUrl: null,
    views: null,
    url: null,
    status: null,
    categoryId: null
  };
  sysVideoCategoryList.value = [];
  proxy.resetForm("videoRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.videoId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加影视";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _videoId = row.videoId || ids.value
  getVideo(_videoId).then(response => {
    form.value = response.data;
    sysVideoCategoryList.value = response.data.sysVideoCategoryList;
    open.value = true;
    title.value = "修改影视";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["videoRef"].validate(valid => {
    if (valid) {
      form.value.sysVideoCategoryList = sysVideoCategoryList.value;
      if (form.value.videoId != null) {
        updateVideo(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addVideo(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _videoIds = row.videoId || ids.value;
  proxy.$modal.confirm('是否确认删除影视编号为"' + _videoIds + '"的数据项？').then(function() {
    return delVideo(_videoIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 影视目录序号 */
function rowSysVideoCategoryIndex({ row, rowIndex }) {
  row.index = rowIndex + 1;
}

/** 影视目录添加按钮操作 */
function handleAddSysVideoCategory() {
  let obj = {};
  obj.categoryName = "";
  sysVideoCategoryList.value.push(obj);
}

/** 影视目录删除按钮操作 */
function handleDeleteSysVideoCategory() {
  if (checkedSysVideoCategory.value.length == 0) {
    proxy.$modal.msgError("请先选择要删除的影视目录数据");
  } else {
    const sysVideoCategorys = sysVideoCategoryList.value;
    const checkedSysVideoCategorys = checkedSysVideoCategory.value;
    sysVideoCategoryList.value = sysVideoCategorys.filter(function(item) {
      return checkedSysVideoCategorys.indexOf(item.index) == -1
    });
  }
}

/** 复选框选中数据 */
function handleSysVideoCategorySelectionChange(selection) {
  checkedSysVideoCategory.value = selection.map(item => item.index)
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/video/export', {
    ...queryParams.value
  }, `video_${new Date().getTime()}.xlsx`)
}

getList();
</script>
