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
      <el-form-item label="时长" prop="duration">
        <el-input
          v-model="queryParams.duration"
          placeholder="请输入时长"
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
      <el-form-item label="地址" prop="url">
        <el-input
          v-model="queryParams.url"
          placeholder="请输入地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="歌词" prop="lyrUrl">
        <el-input
          v-model="queryParams.lyrUrl"
          placeholder="请输入歌词"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="歌手" prop="artistId">
        <el-input
          v-model="queryParams.artistId"
          placeholder="请输入歌手"
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
          v-hasPermi="['system:music:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:music:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:music:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:music:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="musicList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="音乐ID" align="center" prop="musicId"/>
      <el-table-column label="歌名" align="center" prop="title" show-overflow-tooltip width="150"/>
      <el-table-column label="歌手名" align="center" prop="artistName" show-overflow-tooltip width="150"/>
      <el-table-column label="时长" align="center" prop="duration" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="歌曲地址" align="center" prop="url" show-overflow-tooltip width="200"/>
      <el-table-column label="封面地址" align="center" prop="thumbnailUrl" show-overflow-tooltip width="200"/>
      <el-table-column label="歌词URL" align="center" prop="lyrUrl" show-overflow-tooltip width="200"/>
      <el-table-column label="歌手ID" align="center" prop="artistId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:music:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:music:remove']">删除</el-button>
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

    <!-- 添加或修改歌曲对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="musicRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="时长" prop="duration">
          <el-input v-model="form.duration" placeholder="请输入时长" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="封面地址" prop="thumbnailUrl">
          <el-input v-model="form.thumbnailUrl" placeholder="请输入封面地址" />
        </el-form-item>
        <el-form-item label="地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="歌词" prop="lyrUrl">
          <el-input v-model="form.lyrUrl" placeholder="请输入歌词" />
        </el-form-item>
        <el-form-item label="歌手" prop="artistId">
          <el-input v-model="form.artistId" placeholder="请输入歌手" />
        </el-form-item>
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

<script setup name="Music">
import { resetToLocalMusic, listMusic, getMusic, delMusic, addMusic, updateMusic } from "@/api/system/music";

const { proxy } = getCurrentInstance();

const musicList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
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
    duration: null,
    description: null,
    thumbnailUrl: null,
    url: null,
    lyrUrl: null,
    artistId: null
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
  resetToLocalMusic(queryParams.value).then(response => {
    proxy.$modal.msgSuccess(`重置${response}首歌曲`);
    loading.value = false;
  });
}

/** 查询歌曲列表 */
function getList() {
  loading.value = true;

  listMusic(queryParams.value).then(response => {
    musicList.value = response.rows;
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
    musicId: null,
    title: null,
    duration: null,
    description: null,
    thumbnailUrl: null,
    url: null,
    lyrUrl: null,
    artistId: null
  };
  proxy.resetForm("musicRef");
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
  ids.value = selection.map(item => item.musicId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加歌曲";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _musicId = row.musicId || ids.value
  getMusic(_musicId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改歌曲";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["musicRef"].validate(valid => {
    if (valid) {
      if (form.value.musicId != null) {
        updateMusic(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMusic(form.value).then(response => {
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
  const _musicIds = row.musicId || ids.value;
  proxy.$modal.confirm('是否确认删除歌曲编号为"' + _musicIds + '"的数据项？').then(function() {
    return delMusic(_musicIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/music/export', {
    ...queryParams.value
  }, `music_${new Date().getTime()}.xlsx`)
}

getList();
</script>
