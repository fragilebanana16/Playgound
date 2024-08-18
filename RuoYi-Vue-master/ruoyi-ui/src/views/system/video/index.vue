<template>
    <div class="app-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入标题"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="封面地址" prop="thumbnailUrl">
          <el-input
            v-model="queryParams.thumbnailUrl"
            placeholder="请输入封面地址"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="观看次数" prop="views">
          <el-input
            v-model="queryParams.views"
            placeholder="请输入观看次数"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="地址" prop="url">
          <el-input
            v-model="queryParams.url"
            placeholder="请输入地址"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="影视目录" prop="categoryId">
          <el-input
            v-model="queryParams.categoryId"
            placeholder="请输入影视目录"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
  
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
            v-hasPermi="['system:video:add']"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['system:video:edit']"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:video:remove']"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['system:video:export']"
          >导出</el-button>
        </el-col>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
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
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:video:edit']"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:video:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
  
      <!-- 添加或修改影视对话框 -->
      <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
        <el-form ref="form" :model="form" :rules="rules" label-width="80px">
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
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddSysVideoCategory">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteSysVideoCategory">删除</el-button>
            </el-col>
          </el-row>
          <el-table :data="sysVideoCategoryList" :row-class-name="rowSysVideoCategoryIndex" @selection-change="handleSysVideoCategorySelectionChange" ref="sysVideoCategory">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="序号" align="center" prop="index" width="50"/>
            <el-table-column label="$comment" prop="categoryName" width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.categoryName" placeholder="请输入$comment" />
              </template>
            </el-table-column>
          </el-table>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { listVideo, getVideo, delVideo, addVideo, updateVideo } from "@/api/system/video";
  
  export default {
    name: "Video",
    data() {
      return {
        // 遮罩层
        loading: true,
        // 选中数组
        ids: [],
        // 子表选中数据
        checkedSysVideoCategory: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 显示搜索条件
        showSearch: true,
        // 总条数
        total: 0,
        // 影视表格数据
        videoList: [],
        // 影视目录表格数据
        sysVideoCategoryList: [],
        // 弹出层标题
        title: "",
        // 是否显示弹出层
        open: false,
        // 查询参数
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
        // 表单参数
        form: {},
        // 表单校验
        rules: {
          title: [
            { required: true, message: "标题不能为空", trigger: "blur" }
          ],
          url: [
            { required: true, message: "地址不能为空", trigger: "blur" }
          ],
        }
      };
    },
    created() {
      this.getList();
    },
    methods: {
      /** 查询影视列表 */
      getList() {
        this.loading = true;
        listVideo(this.queryParams).then(response => {
          this.videoList = response.rows;
          this.total = response.total;
          this.loading = false;
        });
      },
      // 取消按钮
      cancel() {
        this.open = false;
        this.reset();
      },
      // 表单重置
      reset() {
        this.form = {
          videoId: null,
          title: null,
          description: null,
          thumbnailUrl: null,
          views: null,
          url: null,
          status: null,
          categoryId: null
        };
        this.sysVideoCategoryList = [];
        this.resetForm("form");
      },
      /** 搜索按钮操作 */
      handleQuery() {
        this.queryParams.pageNum = 1;
        this.getList();
      },
      /** 重置按钮操作 */
      resetQuery() {
        this.resetForm("queryForm");
        this.handleQuery();
      },
      // 多选框选中数据
      handleSelectionChange(selection) {
        this.ids = selection.map(item => item.videoId)
        this.single = selection.length!==1
        this.multiple = !selection.length
      },
      /** 新增按钮操作 */
      handleAdd() {
        this.reset();
        this.open = true;
        this.title = "添加影视";
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.reset();
        const videoId = row.videoId || this.ids
        getVideo(videoId).then(response => {
          this.form = response.data;
          this.sysVideoCategoryList = response.data.sysVideoCategoryList;
          this.open = true;
          this.title = "修改影视";
        });
      },
      /** 提交按钮 */
      submitForm() {
        this.$refs["form"].validate(valid => {
          if (valid) {
            this.form.sysVideoCategoryList = this.sysVideoCategoryList;
            if (this.form.videoId != null) {
              updateVideo(this.form).then(response => {
                this.$modal.msgSuccess("修改成功");
                this.open = false;
                this.getList();
              });
            } else {
              addVideo(this.form).then(response => {
                this.$modal.msgSuccess("新增成功");
                this.open = false;
                this.getList();
              });
            }
          }
        });
      },
      /** 删除按钮操作 */
      handleDelete(row) {
        const videoIds = row.videoId || this.ids;
        this.$modal.confirm('是否确认删除影视编号为"' + videoIds + '"的数据项？').then(function() {
          return delVideo(videoIds);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }).catch(() => {});
      },
      /** 影视目录序号 */
      rowSysVideoCategoryIndex({ row, rowIndex }) {
        row.index = rowIndex + 1;
      },
      /** 影视目录添加按钮操作 */
      handleAddSysVideoCategory() {
        let obj = {};
        obj.categoryName = "";
        this.sysVideoCategoryList.push(obj);
      },
      /** 影视目录删除按钮操作 */
      handleDeleteSysVideoCategory() {
        if (this.checkedSysVideoCategory.length == 0) {
          this.$modal.msgError("请先选择要删除的影视目录数据");
        } else {
          const sysVideoCategoryList = this.sysVideoCategoryList;
          const checkedSysVideoCategory = this.checkedSysVideoCategory;
          this.sysVideoCategoryList = sysVideoCategoryList.filter(function(item) {
            return checkedSysVideoCategory.indexOf(item.index) == -1
          });
        }
      },
      /** 复选框选中数据 */
      handleSysVideoCategorySelectionChange(selection) {
        this.checkedSysVideoCategory = selection.map(item => item.index)
      },
      /** 导出按钮操作 */
      handleExport() {
        this.download('system/video/export', {
          ...this.queryParams
        }, `video_${new Date().getTime()}.xlsx`)
      }
    }
  };
  </script>
  